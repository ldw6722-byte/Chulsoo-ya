package com.chulsooya.server.domain.order;

import java.time.Clock;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;

/** 주문 DB 스냅샷을 읽어 요청 시점에만 거래 서류 PDF를 생성한다. */
@Service
public class TradeDocumentService {
    private final OrderRepository orders;
    private final PaymentRepository payments;
    private final StoreRepository stores;
    private final UserRepository users;
    private final TradeDocumentPdfRenderer renderer;
    private final Clock clock;

    public TradeDocumentService(OrderRepository orders, PaymentRepository payments, StoreRepository stores,
            UserRepository users, TradeDocumentPdfRenderer renderer, Clock clock) {
        this.orders = orders;
        this.payments = payments;
        this.stores = stores;
        this.users = users;
        this.renderer = renderer;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public TradeDocumentFile renderForConsumer(Long orderId, Long requesterId, boolean privileged, TradeDocumentType type) {
        Order order = completedOrder(orderId);
        if (!privileged && !order.getConsumerId().equals(requesterId)) throw new DomainException(ErrorCode.FORBIDDEN);
        return render(order, type);
    }

    @Transactional(readOnly = true)
    public TradeDocumentFile renderForSeller(Long orderId, Long requesterId, TradeDocumentType type) {
        Order order = completedOrder(orderId);
        Store requesterStore = stores.findByOwnerId(requesterId)
                .orElseThrow(() -> new DomainException(ErrorCode.FORBIDDEN, "판매점 정보를 확인할 수 없습니다."));
        if (!requesterStore.getId().equals(order.getWinningStoreId())) {
            throw new DomainException(ErrorCode.FORBIDDEN, "낙찰 판매자만 거래 서류를 확인할 수 있습니다.");
        }
        return render(order, type);
    }

    private TradeDocumentFile render(Order order, TradeDocumentType type) {
        User buyer = users.findById(order.getConsumerId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "구매자 정보를 찾을 수 없습니다."));
        Store store = stores.findById(order.getWinningStoreId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매점 정보를 찾을 수 없습니다."));
        Payment payment = payments.findByOrderId(order.getId()).orElse(null);
        byte[] bytes = renderer.render(new TradeDocumentData(type, order, buyer, store, payment, clock.instant()));
        return new TradeDocumentFile(bytes, "%s-주문-%d.pdf".formatted(type.fileStem(), order.getId()));
    }

    private Order completedOrder(Long orderId) {
        Order order = orders.findById(orderId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "주문을 찾을 수 없습니다."));
        if (order.getStatus() != OrderStatus.COMPLETED || order.getWinningStoreId() == null) {
            throw new DomainException(ErrorCode.INVALID_ORDER_STATUS, "거래 완료된 주문에서만 거래 서류를 생성할 수 있습니다.");
        }
        return order;
    }

    public record TradeDocumentFile(byte[] bytes, String fileName) {
    }
}
