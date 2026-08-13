package com.chulsooya.server.domain.admin;

import static com.chulsooya.server.domain.admin.AdminWorkflowDtos.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.matching.Bid;
import com.chulsooya.server.domain.matching.BidRepository;
import com.chulsooya.server.domain.matching.MatchOffer;
import com.chulsooya.server.domain.matching.MatchOfferRepository;
import com.chulsooya.server.domain.order.Order;
import com.chulsooya.server.domain.order.OrderRepository;
import com.chulsooya.server.domain.penalty.PenaltyRepository;

import com.chulsooya.server.domain.store.SlotSettingsLogRepository;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.store.StoreSlotSettingsLog;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class AdminWorkflowService {
    private final OrderRepository orders;
    private final StoreRepository stores;
    private final UserRepository users;
    private final BidRepository bids;
    private final MatchOfferRepository offers;
    private final SlotSettingsLogRepository slotLogs;
    private final PenaltyRepository penalties;

        public AdminWorkflowService(OrderRepository orders, StoreRepository stores, UserRepository users,
            BidRepository bids, MatchOfferRepository offers, SlotSettingsLogRepository slotLogs,
            PenaltyRepository penalties) {

        this.orders = orders;
        this.stores = stores;
        this.users = users;
        this.bids = bids;
        this.offers = offers;
                this.slotLogs = slotLogs;
        this.penalties = penalties;

    }

    public List<WorkflowOrder> workflowOrders(CurrentUser actor) {
        requireAdmin(actor);
        Map<Long, String> consumers = users.findAll().stream().collect(Collectors.toMap(User::getId, User::getName));
        Map<Long, String> storeNames = stores.findAll().stream().collect(Collectors.toMap(Store::getId, Store::getName));
        return orders.findAll().stream()
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .limit(100)
                .map(order -> toWorkflowOrder(order, consumers, storeNames))
                .toList();
    }

    public StoreActivity storeActivity(CurrentUser actor, Long storeId) {
        requireAdmin(actor);
        Store store = stores.findById(storeId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매점을 찾을 수 없습니다."));
        Map<Long, String> consumers = users.findAll().stream().collect(Collectors.toMap(User::getId, User::getName));
        Map<Long, String> storeNames = stores.findAll().stream().collect(Collectors.toMap(Store::getId, Store::getName));
        List<SlotLog> history = slotLogs.findTop50ByStoreIdOrderByCreatedAtDesc(storeId).stream()
                .map(log -> new SlotLog(log.getCreatedAt(), log.getOldConfiguredSlots(), log.getNewConfiguredSlots(), log.getChangedBy(), log.getReason()))
                .toList();
                List<PenaltyLog> penaltyHistory = penalties.findTop50ByStoreIdOrderByAppliedAtDesc(storeId).stream()
                .map(penalty -> new PenaltyLog(penalty.getOrderId(), penalty.getViolationType().name(),
                        penalty.getLevel(), penalty.getTrustScoreDelta(), penalty.getRestrictionUntil(),
                        penalty.getReason(), penalty.getAppliedAt()))
                .toList();
        List<WorkflowOrder> assigned = orders.findByWinningStoreIdOrderByIdDesc(storeId).stream()
                .map(order -> toWorkflowOrder(order, consumers, storeNames)).toList();
        return new StoreActivity(store.getId(), store.getName(), store.getGuCode(), store.getConfiguredSlots(),
                store.getReservedSlots(), store.getActiveSlots(), store.getAvailableSlots(), store.isReceivingOrders(),
                store.isVerified(), store.getTrustScore(), history, penaltyHistory, assigned);

    }

    @Transactional
    public StoreActivity forceSlots(CurrentUser actor, Long storeId, ForceSlotsRequest request) {
        requireAdmin(actor);
        Store store = stores.findByIdForUpdate(storeId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매점을 찾을 수 없습니다."));
        int oldSlots = store.getConfiguredSlots();
        if (request.configuredSlots() == 0) {
            store.enterBusyMode();
        } else {
            store.resumeReceiving(request.configuredSlots());
        }
        slotLogs.save(new StoreSlotSettingsLog(store.getId(), oldSlots, store.getConfiguredSlots(), "ADMIN", request.reason().trim()));
        return storeActivity(actor, storeId);
    }

    private WorkflowOrder toWorkflowOrder(Order order, Map<Long, String> consumers, Map<Long, String> storeNames) {
        List<Bid> orderBids = bids.findByOrderId(order.getId());
        List<MatchOffer> orderOffers = offers.findByOrderIdAndAttempt(order.getId(), order.getRetryCount());
        List<TimelineEvent> timeline = new ArrayList<>();
        timeline.add(new TimelineEvent("ORDER_CREATED", "주문 접수", order.getCreatedAt(), "매칭 대기 시작"));
        if (order.getMatchedAt() != null) timeline.add(new TimelineEvent("BID_WON", "낙찰", order.getMatchedAt(), storeNames.get(order.getWinningStoreId())));
        Bid winner = orderBids.stream().filter(Bid::isWinner).findFirst().orElse(null);
        if (winner != null) timeline.add(new TimelineEvent("BID", "응찰 확정", winner.getCreatedAt(), storeNames.get(winner.getStoreId())));
        if (order.getSellerConfirmedAt() != null) timeline.add(new TimelineEvent("SELLER_CONFIRMED", "판매자 물품 확인", order.getSellerConfirmedAt(), "결제 진행 가능"));
        if (order.getPaidAt() != null) timeline.add(new TimelineEvent("PAYMENT", "결제 완료", order.getPaidAt(), "주문 준비 시작"));
        if (order.getCompletedAt() != null) timeline.add(new TimelineEvent("COMPLETED", "주문 완료", order.getCompletedAt(), "이행 완료"));
        return new WorkflowOrder(order.getId(), order.getStatus().name(), consumers.getOrDefault(order.getConsumerId(), "구매자"),
                order.getWinningStoreId() == null ? null : storeNames.get(order.getWinningStoreId()), order.getGuCode(),
                order.getTotalAmount(), order.getItems().size(), orderOffers.size(), orderBids.size(), order.getCreatedAt(),
                order.getMatchDeadlineAt(), order.getSellerConfirmationDeadlineAt(), order.getMatchedAt(),
                order.getSellerConfirmedAt(), order.getPaidAt(), order.getCompletedAt(), timeline);
    }

    private void requireAdmin(CurrentUser actor) {
        if (!actor.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다.");
    }
}
