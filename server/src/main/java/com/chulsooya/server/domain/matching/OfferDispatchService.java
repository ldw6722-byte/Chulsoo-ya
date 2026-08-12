package com.chulsooya.server.domain.matching;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.config.AppProperties;
import com.chulsooya.server.domain.order.Order;
import com.chulsooya.server.domain.store.MissedOrderLog;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.MissedOrderLogRepository;
import com.chulsooya.server.domain.store.StoreRepository;

/**
 * 계층형 슬롯 기반 분산 매칭.
 * 동일 gu_code 자격 판매자를 tier 지연(0/3/6초) 그룹으로 나누고, 그룹 내에서는 신뢰 점수 순으로
 * 가용 슬롯이 있는 매장에만 제안을 발송한다. 슬롯 포화 매장은 MissedOrderLog 로 기록한다.
 */
@Service
public class OfferDispatchService {

	private final StoreRepository storeRepository;
	private final MatchOfferRepository offerRepository;
	private final MissedOrderLogRepository missedOrderLogRepository;
	private final AppProperties properties;
	private final Clock clock;

	public OfferDispatchService(StoreRepository storeRepository,
			MatchOfferRepository offerRepository,
			MissedOrderLogRepository missedOrderLogRepository,
			AppProperties properties,
			Clock clock) {
		this.storeRepository = storeRepository;
		this.offerRepository = offerRepository;
		this.missedOrderLogRepository = missedOrderLogRepository;
		this.properties = properties;
		this.clock = clock;
	}

	/**
	 * 주문에 대한 제안을 발송한다.
	 * 재입찰(attempt > 0)에서는 시차 노출 없이 전 계층에 즉시 발송한다.
	 */
	@Transactional
	public int dispatch(Order order) {
		Instant now = clock.instant();
		boolean accelerated = order.getRetryCount() > 0;
		int ttl = properties.matching().offerTtlSeconds();

		List<Store> eligible = new ArrayList<>(storeRepository.findEligible(order.getGuCode()));
		eligible.sort(Comparator
				.comparingInt((Store s) -> s.getTier().getDispatchDelaySeconds())
				.thenComparing(Comparator.comparingDouble(Store::getTrustScore).reversed()));

		int dispatched = 0;
		for (Store store : eligible) {
			if (offerRepository
					.findByOrderIdAndStoreIdAndAttempt(order.getId(), store.getId(), order.getRetryCount())
					.isPresent()) {
				continue;
			}
			if (!store.canReceiveOffer(now)) {
				missedOrderLogRepository.save(new MissedOrderLog(store.getId(), order.getId(), missReason(store, now)));
				continue;
			}
			Instant offeredAt = accelerated
					? now
					: now.plusSeconds(store.getTier().getDispatchDelaySeconds());

			store.reserveSlot();
			offerRepository.save(new MatchOffer(order.getId(), store.getId(), order.getRetryCount(),
					store.getTier(), offeredAt, ttl));
			dispatched++;
		}
		return dispatched;
	}

	private String missReason(Store store, Instant now) {
		if (store.isRestricted(now)) {
			return "RESTRICTED";
		}
		if (!store.isReceivingOrders()) {
			return "NOT_RECEIVING";
		}
		return "SLOT_FULL";
	}
}
