package com.chulsooya.server.domain.support;

import java.time.Instant;
import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class SupportDtos {
    private SupportDtos() {}

    public record CreateInquiryRequest(
            @NotBlank @Size(max = 30) String category,
            @NotBlank @Size(max = 120) String title,
            @NotBlank @Size(max = 3000) String content) {}

    public record ReplyInquiryRequest(@NotBlank @Size(max = 3000) String reply) {}

    public record ChangeInquiryStatusRequest(@NotNull SupportInquiryStatus status) {}

    public record CustomerNoticeRequest(
            @NotBlank @Size(max = 120) String title,
            @NotBlank @Size(max = 3000) String content,
            Instant displayStartAt,
            Instant displayEndAt) {}

    public record CustomerNoticeActiveRequest(@NotNull Boolean active, boolean appendRegistrationTime) {}

    public record InquiryResponse(
            Long id,
            String category,
            String title,
            String content,
            SupportInquiryStatus status,
            String adminReply,
            Instant answeredAt,
            Instant createdAt,
            Instant updatedAt) {
        static InquiryResponse from(SupportInquiry inquiry) {
            return new InquiryResponse(inquiry.getId(), inquiry.getCategory(), inquiry.getTitle(), inquiry.getContent(),
                    inquiry.getStatus(), inquiry.getAdminReply(), inquiry.getAnsweredAt(), inquiry.getCreatedAt(), inquiry.getUpdatedAt());
        }
    }

    public record AdminInquiryResponse(
            Long id,
            Long consumerId,
            String consumerName,
            String category,
            String title,
            String content,
            SupportInquiryStatus status,
            String adminReply,
            Instant answeredAt,
            Instant createdAt,
            Instant updatedAt) {}

    public record NotificationResponse(
            Long id,
            String type,
            String title,
            String content,
            String targetPath,
            Instant readAt,
            Instant createdAt) {
        static NotificationResponse from(CustomerNotification notification) {
            return new NotificationResponse(notification.getId(), notification.getType(), notification.getTitle(), notification.getContent(),
                    notification.getTargetPath(), notification.getReadAt(), notification.getCreatedAt());
        }
    }

    public record CustomerCenterResponse(List<FaqItem> faqs, List<InquiryResponse> inquiries, List<NotificationResponse> notifications) {}
    public record FaqItem(String category, String question, String answer) {}
}
