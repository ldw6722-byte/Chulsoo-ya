package com.chulsooya.server.domain.subscription;

import java.time.Clock;
import java.time.Instant;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.store.SubscriptionTier;

@Component
public class SubscriptionExpiryScheduler {
    private final StoreRepository stores; private final StoreSubscriptionHistoryRepository history; private final Clock clock;
    public SubscriptionExpiryScheduler(StoreRepository stores, StoreSubscriptionHistoryRepository history, Clock clock) { this.stores = stores; this.history = history; this.clock = clock; }
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void expireDueMemberships() { Instant now = clock.instant(); for (var store : stores.findByTierNotAndSubscriptionExpiresAtLessThanEqual(SubscriptionTier.SILVER, now)) { var beforeTier = store.getTier(); var beforeExpiry = store.getSubscriptionExpiresAt(); if (store.expireMembershipIfNeeded(now)) history.save(new StoreSubscriptionHistory(store.getId(), null, beforeTier, SubscriptionTier.SILVER, beforeExpiry, null, SubscriptionHistoryEvent.EXPIRED, null, "구독 기간 만료", now)); } }
}

