package com.chulsooya.server.domain.order;

import org.springframework.stereotype.Service;
import com.chulsooya.server.domain.support.CustomerNotification;
import com.chulsooya.server.domain.support.CustomerNotificationRepository;

@Service
public class OrderDeliveryNotificationService {
    private final CustomerNotificationRepository notifications;

    public OrderDeliveryNotificationService(CustomerNotificationRepository notifications) {
        this.notifications = notifications;
    }

    public void notifyConsumer(Order order, OrderStatus next) {
        if (order.getFulfillmentMethod() != FulfillmentMethod.DELIVERY) return;
        if (next == OrderStatus.DELIVERY_IN_PROGRESS) {
            notifications.save(new CustomerNotification(order.getConsumerId(), "DELIVERY_STARTED", "판매점에서 배달을 시작했습니다", "주문 #" + order.getId() + "의 배달이 출발했습니다.", "/my"));
        }
        if (next == OrderStatus.COMPLETED) {
            notifications.save(new CustomerNotification(order.getConsumerId(), "DELIVERY_COMPLETED", "배달이 완료되었습니다", "주문 #" + order.getId() + "의 배달이 완료되었습니다. 거래 후기를 남길 수 있습니다.", "/my"));
        }
    }
}
