package com.chulsooya.server.domain.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.chulsooya.server.domain.support.CustomerNotification;
import com.chulsooya.server.domain.support.CustomerNotificationRepository;

@ExtendWith(MockitoExtension.class)
class OrderDeliveryNotificationServiceTest {
    @Mock private CustomerNotificationRepository notifications;

    @Test
    void delivery_start_and_completion_notify_the_consumer() {
        OrderDeliveryNotificationService service = new OrderDeliveryNotificationService(notifications);
        Order order = new Order(7L, "GU_TEST", FulfillmentMethod.DELIVERY, "서울시 강남구", null, null, 0);

        service.notifyConsumer(order, OrderStatus.DELIVERY_IN_PROGRESS);
        service.notifyConsumer(order, OrderStatus.COMPLETED);

        ArgumentCaptor<CustomerNotification> captor = ArgumentCaptor.forClass(CustomerNotification.class);
        verify(notifications, org.mockito.Mockito.times(2)).save(captor.capture());
        assertThat(captor.getAllValues()).extracting(CustomerNotification::getType)
                .containsExactly("DELIVERY_STARTED", "DELIVERY_COMPLETED");
        assertThat(captor.getAllValues()).allMatch(note -> note.getUserId().equals(7L));
    }
}
