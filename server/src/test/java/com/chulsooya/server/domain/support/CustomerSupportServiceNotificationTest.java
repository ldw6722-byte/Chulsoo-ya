package com.chulsooya.server.domain.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.chulsooya.server.domain.support.SupportDtos.ReplyInquiryRequest;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@ExtendWith(MockitoExtension.class)
class CustomerSupportServiceNotificationTest {
    @Mock private SupportInquiryRepository inquiries;
    @Mock private CustomerNotificationRepository notifications;
    @Mock private UserRepository users;
    @Mock private BusinessNotificationService businessNotifications;

    @Test
    void adminReplyCreatesUnreadNotificationForInquiryConsumer() {
        SupportInquiry inquiry = new SupportInquiry(41L, "일반", "배송 문의", "언제 도착하나요?");
        CustomerSupportService service = new CustomerSupportService(inquiries, notifications, users, businessNotifications);
        when(inquiries.findById(7L)).thenReturn(Optional.of(inquiry));
        when(users.findById(41L)).thenReturn(Optional.of(new User("consumer@test.dev", "고객", "010", UserRole.CONSUMER)));

        service.reply(new CurrentUser(1L, UserRole.ADMIN), 7L, new ReplyInquiryRequest("내일 도착 예정입니다."));

        ArgumentCaptor<CustomerNotification> captured = ArgumentCaptor.forClass(CustomerNotification.class);
        verify(notifications).save(captured.capture());
        assertThat(captured.getValue().getUserId()).isEqualTo(41L);
        assertThat(captured.getValue().getType()).isEqualTo("INQUIRY_ANSWERED");
        assertThat(captured.getValue().getReadAt()).isNull();
        assertThat(captured.getValue().getTargetPath()).isEqualTo("/support");
    }
}
