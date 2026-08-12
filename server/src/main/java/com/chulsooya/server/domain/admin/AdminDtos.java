package com.chulsooya.server.domain.admin;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class AdminDtos {
    private AdminDtos() {
    }

    public record OverviewResponse(
            Summary summary,
            Map<String, Long> orderStatusCounts,
            List<RecentOrder> recentOrders,
            List<StoreAttention> storeAttention,
            Instant serverTime) {
    }

    public record Summary(
            long todayOrderCount,
            long matchingOrderCount,
            long totalProductCount,
            long totalUserCount,
            long sellerCount,
            long verifiedStoreCount,
            long todayRevenue,
            long attentionStoreCount) {
    }

    public record RecentOrder(
            Long id,
            String status,
            String representativeProductName,
            int totalAmount,
            int itemCount,
            String winningStoreName,
            Instant createdAt) {
    }

    public record StoreAttention(
            Long id,
            String name,
            String guCode,
            String state,
            int availableSlots,
            double trustScore,
            Instant restrictedUntil) {
    }
}