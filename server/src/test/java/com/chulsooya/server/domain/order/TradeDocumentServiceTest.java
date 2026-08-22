package com.chulsooya.server.domain.order;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;

@ExtendWith(MockitoExtension.class)
class TradeDocumentServiceTest {

    @Mock private OrderRepository orders;
    @Mock private PaymentRepository payments;
    @Mock private StoreRepository stores;
    @Mock private UserRepository users;
    @Mock private TradeDocumentPdfRenderer renderer;
    @Mock private Clock clock;
    @InjectMocks private TradeDocumentService service;

    @Test
    @DisplayName("완료된 주문은 구매자 본인이 영수증을 즉시 생성할 수 있다")
    void consumerCanRenderCompletedReceipt() {
        Order order = completedOrder(11L, 21L, 31L);
        when(orders.findById(11L)).thenReturn(Optional.of(order));
        User buyer = new User("buyer@test.local", "구매자", "010-0000-0000", UserRole.CONSUMER);
        Store store = org.mockito.Mockito.mock(Store.class);
        when(users.findById(21L)).thenReturn(Optional.of(buyer));
        when(stores.findById(31L)).thenReturn(Optional.of(store));
        when(payments.findByOrderId(11L)).thenReturn(Optional.empty());
        when(renderer.render(any())).thenReturn(new byte[] { 1, 2, 3 });
        when(clock.instant()).thenReturn(Instant.parse("2026-08-23T00:00:00Z"));

        service.renderForConsumer(11L, 21L, false, TradeDocumentType.RECEIPT);

        verify(renderer).render(any());
    }

    @Test
    @DisplayName("구매자는 자신의 주문이 아니면 거래 문서를 생성할 수 없다")
    void otherConsumerCannotRenderDocument() {
        Order order = org.mockito.Mockito.mock(Order.class);
        when(order.getStatus()).thenReturn(OrderStatus.COMPLETED);
        when(order.getConsumerId()).thenReturn(21L);
        when(orders.findById(11L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.renderForConsumer(11L, 22L, false, TradeDocumentType.RECEIPT))
                .isInstanceOf(DomainException.class);
    }

    @Test
    @DisplayName("낙찰 판매자만 거래명세서를 생성할 수 있다")
    void winningSellerCanRenderStatement() {
        Order order = completedOrder(11L, 21L, 31L);
        Store store = org.mockito.Mockito.mock(Store.class);
        when(store.getId()).thenReturn(31L);
        when(orders.findById(11L)).thenReturn(Optional.of(order));
        when(stores.findByOwnerId(41L)).thenReturn(Optional.of(store));
        User buyer = new User("buyer@test.local", "구매자", "010-0000-0000", UserRole.CONSUMER);
        when(users.findById(21L)).thenReturn(Optional.of(buyer));
        when(stores.findById(31L)).thenReturn(Optional.of(store));
        when(payments.findByOrderId(11L)).thenReturn(Optional.empty());
        when(renderer.render(any())).thenReturn(new byte[] { 1, 2, 3 });
        when(clock.instant()).thenReturn(Instant.parse("2026-08-23T00:00:00Z"));

        service.renderForSeller(11L, 41L, TradeDocumentType.TRANSACTION_STATEMENT);

        verify(renderer).render(any());
    }

    @Test
    @DisplayName("거래 완료 전 주문은 문서를 생성할 수 없다")
    void incompleteOrderCannotRenderDocument() {
        Order order = org.mockito.Mockito.mock(Order.class);
        when(order.getStatus()).thenReturn(OrderStatus.PAID);
        when(orders.findById(11L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.renderForConsumer(11L, 21L, false, TradeDocumentType.ORDER_STATEMENT))
                .isInstanceOf(DomainException.class);
    }

    private Order completedOrder(Long orderId, Long consumerId, Long storeId) {
        Order order = org.mockito.Mockito.mock(Order.class);
        when(order.getId()).thenReturn(orderId);
        when(order.getConsumerId()).thenReturn(consumerId);
        when(order.getWinningStoreId()).thenReturn(storeId);
        when(order.getStatus()).thenReturn(OrderStatus.COMPLETED);
        return order;
    }
}
