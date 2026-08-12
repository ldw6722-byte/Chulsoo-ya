package com.chulsooya.server.domain.admin;

import static com.chulsooya.server.domain.admin.AdminDtos.OverviewResponse;
import static com.chulsooya.server.domain.admin.AdminDtos.RecentOrder;
import static com.chulsooya.server.domain.admin.AdminDtos.StoreAttention;
import static com.chulsooya.server.domain.admin.AdminDtos.Summary;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.chulsooya.server.domain.catalog.ProductRepository;
import com.chulsooya.server.domain.order.Order;
import com.chulsooya.server.domain.order.OrderRepository;
import com.chulsooya.server.domain.order.OrderStatus;
import com.chulsooya.server.domain.order.Payment;
import com.chulsooya.server.domain.order.PaymentRepository;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class AdminService {
    private static final ZoneId KOREA = ZoneId.of("Asia/Seoul");

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;

    public AdminService(
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            StoreRepository storeRepository) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.storeRepository = storeRepository;
    }

    public OverviewResponse overview(CurrentUser actor) {
        if (!actor.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다.");
        }

        Instant now = Instant.now();
        LocalDate today = LocalDate.now(KOREA);
        List<Order> orders = orderRepository.findAll();
        List<User> users = userRepository.findAll();
        List<Store> stores = storeRepository.findAll();
        Map<Long, String> storeNames = stores.stream()
                .collect(Collectors.toMap(Store::getId, Store::getName));
        Map<String, Long> statusCounts = orders.stream()
                .collect(Collectors.groupingBy(order -> order.getStatus().name(), Collectors.counting()));

        long todayOrderCount = orders.stream()
                .filter(order -> order.getCreatedAt().atZone(KOREA).toLocalDate().equals(today))
                .count();
        long matchingOrderCount = orders.stream()
                .filter(order -> order.getStatus() == OrderStatus.WAITING_MATCH
                        || order.getStatus() == OrderStatus.SELLER_CONFIRMING
                        || order.getStatus() == OrderStatus.RE_MATCHING)
                .count();
        long todayRevenue = paymentRepository.findAll().stream()
                .filter(payment -> payment.getStatus() == Payment.Status.PAID && payment.getPaidAt() != null)
                .filter(payment -> payment.getPaidAt().atZone(KOREA).toLocalDate().equals(today))
                .mapToLong(Payment::getAmount)
                .sum();
        List<StoreAttention> attentionStores = stores.stream()
                .filter(store -> requiresAttention(store, now))
                .sorted(Comparator.comparing(Store::isVerified).thenComparing(Store::getTrustScore))
                .limit(6)
                .map(store -> toStoreAttention(store, now))
                .toList();

        Summary summary = new Summary(
                todayOrderCount,
                matchingOrderCount,
                productRepository.count(),
                users.size(),
                users.stream().filter(user -> user.getRole() == UserRole.SELLER).count(),
                stores.stream().filter(Store::isVerified).count(),
                todayRevenue,
                attentionStores.size());

        List<RecentOrder> recentOrders = orders.stream()
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .limit(8)
                .map(order -> toRecentOrder(order, storeNames))
                .toList();

        return new OverviewResponse(summary, statusCounts, recentOrders, attentionStores, now);
    }

    private boolean requiresAttention(Store store, Instant now) {
        return !store.isVerified()
                || store.isRestricted(now)
                || !store.isReceivingOrders()
                || store.getAvailableSlots() <= 0;
    }

    private StoreAttention toStoreAttention(Store store, Instant now) {
        String state = !store.isVerified() ? "승인 대기"
                : store.isRestricted(now) ? "응찰 제한"
                : !store.isReceivingOrders() ? "주문 미수신"
                : "슬롯 소진";
        return new StoreAttention(
                store.getId(),
                store.getName(),
                store.getGuCode(),
                state,
                store.getAvailableSlots(),
                store.getTrustScore(),
                store.getRestrictedUntil());
    }

    private RecentOrder toRecentOrder(Order order, Map<Long, String> storeNames) {
        String productName = order.getItems().isEmpty()
                ? "주문 상품"
                : order.getItems().getFirst().getProductName();
        return new RecentOrder(
                order.getId(),
                order.getStatus().name(),
                productName,
                order.getTotalAmount(),
                order.getItems().size(),
                order.getWinningStoreId() == null ? null : storeNames.get(order.getWinningStoreId()),
                order.getCreatedAt());
    }
}