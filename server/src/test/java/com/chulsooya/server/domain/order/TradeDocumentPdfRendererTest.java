package com.chulsooya.server.domain.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRole;

class TradeDocumentPdfRendererTest {

    @Test
    @DisplayName("거래명세서는 주문 DB 스냅샷으로 실제 PDF 바이트를 생성한다")
    void rendersKoreanTradeStatementPdf() {
        Order order = mock(Order.class);
        when(order.getId()).thenReturn(91L);
        when(order.getCompletedAt()).thenReturn(Instant.parse("2026-08-23T00:00:00Z"));
        when(order.getFulfillmentMethod()).thenReturn(FulfillmentMethod.DELIVERY);
        when(order.getAddress()).thenReturn("서울특별시 강남구 테헤란로 1");
        when(order.getAddressDetail()).thenReturn("101호");
        when(order.getItems()).thenReturn(List.of(new OrderItem(1L, "철수야 망치", "450g", "개", 2, 12000)));
        when(order.getItemsAmount()).thenReturn(24000);
        when(order.getDeliveryFee()).thenReturn(3000);
        when(order.getDiscountAmount()).thenReturn(1000);
        when(order.getTotalAmount()).thenReturn(26000);
        Store store = mock(Store.class);
        when(store.getName()).thenReturn("철수 철물점");
        when(store.getPhone()).thenReturn("02-1234-5678");
        Payment payment = mock(Payment.class);
        when(payment.getMethod()).thenReturn("CARD");
        when(payment.getPaidAt()).thenReturn(Instant.parse("2026-08-22T23:30:00Z"));

        byte[] pdf = new TradeDocumentPdfRenderer().render(new TradeDocumentData(
                TradeDocumentType.TRANSACTION_STATEMENT,
                order,
                new User("buyer@test.local", "구매자", "010-0000-0000", UserRole.CONSUMER),
                store,
                payment,
                Instant.parse("2026-08-23T00:01:00Z")));

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 4, java.nio.charset.StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }
}
