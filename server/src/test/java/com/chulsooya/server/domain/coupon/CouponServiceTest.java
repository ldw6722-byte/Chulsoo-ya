package com.chulsooya.server.domain.coupon;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.chulsooya.server.domain.order.FulfillmentMethod;
import com.chulsooya.server.domain.order.Order;
import com.chulsooya.server.domain.order.OrderItem;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock private CouponIssueRepository issues;
    @Mock private CouponEventRepository events;

    @Test
    void available_coupon_is_applied_at_server_calculated_discount_and_audited() {
        Instant now = Instant.parse("2026-08-13T00:00:00Z");
        Coupon coupon = new Coupon("WELCOME500", "가입 축하 500원", 500, 1_000, now.minusSeconds(60), now.plusSeconds(3600), 1L, now);
        CouponIssue issue = new CouponIssue(coupon, 7L, now, now.plusSeconds(3600));
        Order order = new Order(7L, "GU_TEST", FulfillmentMethod.PICKUP, null, null, null, 0);
        order.addItem(new OrderItem(1L, "테스트 상품", null, "개", 1, 2_000));
        CouponService service = new CouponService(issues, events, Clock.fixed(now, ZoneOffset.UTC));

        when(issues.findByIdForUpdate(10L)).thenReturn(Optional.of(issue));

        service.applyToOrder(7L, 10L, order);

        assertThat(order.getDiscountAmount()).isEqualTo(500);
        assertThat(issue.getStatus()).isEqualTo(CouponIssueStatus.APPLIED);
        verify(events).save(any(CouponEvent.class));
    }

    @Test
    void cancellation_restores_an_applied_coupon_once_when_it_is_still_valid() {
        Instant now = Instant.parse("2026-08-13T00:00:00Z");
        Coupon coupon = new Coupon("WELCOME500", "가입 축하 500원", 500, 1_000, now.minusSeconds(60), now.plusSeconds(3600), 1L, now);
        CouponIssue issue = new CouponIssue(coupon, 7L, now, now.plusSeconds(3600));
        Order order = new Order(7L, "GU_TEST", FulfillmentMethod.PICKUP, null, null, null, 0);
        order.addItem(new OrderItem(1L, "테스트 상품", null, "개", 1, 2_000));
        order.applyCoupon(10L, 500);
        issue.apply(1L, 2_000, now);
        CouponService service = new CouponService(issues, events, Clock.fixed(now, ZoneOffset.UTC));

        when(issues.findByIdForUpdate(10L)).thenReturn(Optional.of(issue));
        service.restoreAfterOrderCancellation(order, 7L);
        service.restoreAfterOrderCancellation(order, 7L);

        assertThat(issue.getStatus()).isEqualTo(CouponIssueStatus.AVAILABLE);
        verify(events).save(any(CouponEvent.class));
    }
}
