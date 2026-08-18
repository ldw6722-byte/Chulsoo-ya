package com.chulsooya.server.domain.subscription;

import java.time.Clock;
import java.time.Instant;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.store.SubscriptionTier;
import com.chulsooya.server.domain.support.BusinessNotificationService;

@Component
public class SubscriptionExpiryScheduler {
        private final StoreRepository stores; private final StoreSubscriptionHistoryRepository history; private final Clock clock; private final BusinessNotificationService notifications;
    public SubscriptionExpiryScheduler(StoreRepository stores, StoreSubscriptionHistoryRepository history, Clock clock, BusinessNotificationService notifications) { this.stores = stores; this.history = history; this.clock = clock; this.notifications = notifications; }

    @Scheduled(fixedDelay = 60_000)
    @Transactional
        public void expireDueMemberships() { Instant now = clock.instant(); for (var store : stores.findByTierNotAndSubscriptionExpiresAtLessThanEqual(SubscriptionTier.SILVER, now)) { var beforeTier = store.getTier(); var beforeExpiry = store.getSubscriptionExpiresAt(); if (store.expireMembershipIfNeeded(now)) { history.save(new StoreSubscriptionHistory(store.getId(), null, beforeTier, SubscriptionTier.SILVER, beforeExpiry, null, SubscriptionHistoryEvent.EXPIRED, null, "구독 기간 만료", now)); notifications.notifyUser(store.getOwner().getId(), "SUBSCRIPTION_EXPIRED", "구독 기간이 만료되었습니다", "기본 실버 등급으로 변경되었습니다.", "/seller/subscription"); } } }

}

