package com.chulsooya.server.domain.matching;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.config.AppProperties;
import com.chulsooya.server.domain.order.Order;
import com.chulsooya.server.domain.store.MissedOrderLog;
import com.chulsooya.server.domain.store.MissedOrderLogRepository;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.store.SubscriptionTier;
import com.chulsooya.server.domain.support.BusinessNotificationService;

/**
 * 가용 슬롯 기반 계층형 분산 매칭.
 *
 * 한 번의 분배에서는 한 건의 새 제안만 생성한다. 동일 지역·등급에서는 영속 커서로 시작점을 회전하고,
 * 상위 등급이 모두 가용하지 않을 때만 다음 등급으로 즉시 넘긴다. 시차가 지난 등급은 기존 상위 제안이
 * 열려 있어도 순차 확산할 수 있으므로 특정 판매점의 알림 독점을 막는다.
 */
@Service
public class OfferDispatchService {

    private static final List<SubscriptionTier> PRIORITY_TIERS = List.of(
            SubscriptionTier.PREMIUM, SubscriptionTier.GOLD, SubscriptionTier.SILVER);

    private final StoreRepository storeRepository;
    private final MatchOfferRepository offerRepository;
    private final MissedOrderLogRepository missedOrderLogRepository;
    private final AppProperties properties;
    private final java.time.Clock clock;
    private final BusinessNotificationService notifications;

    public OfferDispatchService(StoreRepository storeRepository,
            MatchOfferRepository offerRepository,
            MissedOrderLogRepository missedOrderLogRepository,
            AppProperties properties,
            java.time.Clock clock,
            BusinessNotificationService notifications) {
        this.storeRepository = storeRepository;
        this.offerRepository = offerRepository;
        this.missedOrderLogRepository = missedOrderLogRepository;this.properties = properties;
        this.clock = clock;
        this.notifications = notifications;
    }

    /**
     * 새 제안 한 건을 생성한다. 호출은 주문 생성 직후와 스케줄러 확산 시 모두 가능하며, 같은 주문·회차·매장
     * 유니크 제약으로 중복 제안을 만들지 않는다.
     */
    @Transactional
    public int dispatch(Order order) {
        Instant now = clock.instant();
        List<MatchOffer> currentOffers = offerRepository.findByOrderIdAndAttempt(order.getId(), order.getRetryCount());
        List<Store> eligible = new ArrayList<>(storeRepository.findEligible(order.getGuCode()));
        eligible.sort(Comparator.comparingDouble(Store::getTrustScore).reversed().thenComparing(Store::getId));

        boolean higherTierHasNoCandidate = false;
        for (SubscriptionTier tier : PRIORITY_TIERS) {
            List<Store> tierStores = eligible.stream().filter(store -> store.getTier() == tier).toList();
            if (tierStores.isEmpty()) {
                higherTierHasNoCandidate = true;
                continue;
            }

            boolean hasOpenOffer = currentOffers.stream()
                    .filter(offer -> offer.getTier() == tier)
                    .anyMatch(offer -> offer.isOpen(now));
            if (hasOpenOffer) {
                // 상위 제안은 유지하되, 하위 등급이 도달 시각을 지났다면 다음 반복에서 순차 확산한다.
                higherTierHasNoCandidate = false;
                continue;
            }

            List<Store> candidates = availableWithoutOffer(order, currentOffers, tierStores, now);
            if (candidates.isEmpty()) {
                higherTierHasNoCandidate = true;
                continue;
            }

            Instant matchingStartedAt = order.getMatchDeadlineAt().minusSeconds(properties.matching().matchWindowSeconds());
            boolean tierDelayPassed = !now.isBefore(matchingStartedAt.plusSeconds(tier.getDispatchDelaySeconds()));
            if (!tierDelayPassed && !higherTierHasNoCandidate) {
                // 상위 판매자가 수신 가능한 경우에는 계약된 0/30/60초 우선 시간을 존중한다.
                return 0;
            }

            // 같은 멤버십 단계의 가용 판매자에게 동시에 공개하되, 각 판매자의 가용 슬롯만큼만 수신한다.
            for (Store candidate : candidates) {
                candidate.reserveSlot();
                offerRepository.save(new MatchOffer(order.getId(), candidate.getId(), order.getRetryCount(), tier, now,
                        properties.matching().offerTtlSeconds()));
                notifications.notifyUser(candidate.getOwner().getId(), "MATCH_OFFER_RECEIVED", "새 주문 제안이 도착했습니다",
                        "주문 #" + order.getId() + "의 응찰 요청을 확인해 주세요.", "/seller");
            }
            return candidates.size();
        }
        return 0;
    }

    private List<Store> availableWithoutOffer(Order order, List<MatchOffer> currentOffers,
            List<Store> tierStores, Instant now) {
        List<Store> candidates = new ArrayList<>();
        for (Store store : tierStores) {
            boolean alreadyOffered = currentOffers.stream().anyMatch(offer -> offer.getStoreId().equals(store.getId()));
            if (alreadyOffered) continue;
            if (store.canReceiveOffer(now)) {
                candidates.add(store);
            } else {
                missedOrderLogRepository.save(new MissedOrderLog(store.getId(), order.getId(), missReason(store, now)));
            }
        }
        return candidates;
    }


    private String missReason(Store store, Instant now) {
        if (store.isRestricted(now)) return "RESTRICTED";
        if (!store.isReceivingOrders()) return "NOT_RECEIVING";
        return "SLOT_FULL";
    }
}

