package com.chulsooya.server.domain.order;

import org.springframework.stereotype.Service;
import com.chulsooya.server.domain.support.CustomerNotification;
import com.chulsooya.server.domain.support.CustomerNotificationRepository;
import com.chulsooya.server.domain.store.StoreRepository;

@Service
public class OrderDeliveryNotificationService {
    private final CustomerNotificationRepository notifications;
    private final StoreRepository stores;

    public OrderDeliveryNotificationService(CustomerNotificationRepository notifications, StoreRepository stores) {
        this.notifications = notifications;
        this.stores = stores;
    }

    public void notifyConsumer(Order order, OrderStatus next) {
        if (order.getFulfillmentMethod() == FulfillmentMethod.DELIVERY && next == OrderStatus.DELIVERY_IN_PROGRESS) {
            notifications.save(new CustomerNotification(order.getConsumerId(), "DELIVERY_STARTED", "판매점에서 배달을 시작했습니다", "주문 #" + order.getId() + "의 배달이 출발했습니다.", "/my"));
        }
        if (next != OrderStatus.COMPLETED) return;

        String completion = order.getFulfillmentMethod() == FulfillmentMethod.DELIVERY ? "배달이 완료되었습니다" : "픽업 거래가 완료되었습니다";
        notifications.save(new CustomerNotification(order.getConsumerId(), "ORDER_COMPLETED", completion,
                "주문 #" + order.getId() + "의 거래가 완료되었습니다. 거래 서류를 확인할 수 있습니다.", "/orders/" + order.getId()));
        notifications.save(new CustomerNotification(order.getConsumerId(), "TRADE_DOCUMENT_READY", "거래 서류가 준비되었습니다",
                "영수증·주문 내역서·거래명세서를 주문 상세에서 다운로드할 수 있습니다.", "/orders/" + order.getId()));
        stores.findById(order.getWinningStoreId()).ifPresent(store -> notifications.save(new CustomerNotification(
                store.getOwner().getId(), "TRADE_DOCUMENT_READY", "거래 서류가 준비되었습니다",
                "주문 #" + order.getId() + "의 거래명세서를 판매자 주문 화면에서 다운로드할 수 있습니다.", "/seller/orders")));
    }
}
