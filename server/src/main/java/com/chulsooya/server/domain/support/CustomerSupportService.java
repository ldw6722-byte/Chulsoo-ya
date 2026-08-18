package com.chulsooya.server.domain.support;

import static com.chulsooya.server.domain.support.SupportDtos.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class CustomerSupportService {
    private static final List<FaqItem> FAQS = List.of(
            new FaqItem("주문", "주문한 상품의 매칭 상태는 어디에서 확인하나요?", "마이철수의 주문 내역에서 판매자 응찰, 낙찰, 물품 확인 상태를 순서대로 확인할 수 있습니다."),
            new FaqItem("주문", "판매자 응찰은 언제 마감되나요?", "주문을 매칭 요청하면 서버가 정한 마감 시간까지 해당 구의 판매점에 제안이 전달됩니다."),
            new FaqItem("결제", "판매자 확인 전에도 결제할 수 있나요?", "아닙니다. 판매자가 재고와 품목을 확인한 뒤 결제 안내가 열립니다."),
            new FaqItem("결제", "결제 완료 후 주문을 취소할 수 있나요?", "주문 상태와 판매자 처리 단계에 따라 취소 또는 클레임 접수로 안내됩니다. 주문 상세에서 요청해 주세요."),
            new FaqItem("취소·반품", "반품비용은 누가 부담하나요?", "상품 하자·오배송은 판매점 부담을 원칙으로 하며, 단순 변심은 상품 상태와 판매점 정책에 따라 안내됩니다."),
            new FaqItem("취소·반품", "반품 접수 후 환불은 언제 되나요?", "회수 또는 반품 발송과 판매점 검수가 완료되면 결제 수단별 환불 절차가 진행됩니다."),
            new FaqItem("취소·반품", "부분 교체가 가능한가요?", "수량·규격이 다른 상품, 파손 상품은 주문 상세에서 부분 교체 또는 반품 요청을 접수할 수 있습니다."),
            new FaqItem("판매점", "가까운 판매점은 어떻게 찾나요?", "메인의 판매점 찾기에서 시와 구를 선택하면 등록 판매점과 취급 품목, 운영 상태를 확인할 수 있습니다."),
            new FaqItem("판매점", "판매점이 주문을 수신하지 않는 이유는 무엇인가요?", "판매점의 가용 슬롯, 영업 상태, 신뢰 제한, 해당 구의 주문 수신 설정에 따라 제안이 전달되지 않을 수 있습니다."),
            new FaqItem("배송", "배송 진행 상태는 어디에서 확인하나요?", "판매자가 배송을 시작하면 마이철수 주문 내역에서 준비·배송 진행·완료 상태를 확인할 수 있습니다."),
            new FaqItem("회원", "마이철수에서 어떤 정보를 확인할 수 있나요?", "주문 내역, 결제 상태, 취소·반품 요청과 계정 정보를 한 곳에서 확인할 수 있습니다."),
            new FaqItem("회원", "회원정보를 수정하고 싶어요.", "마이철수의 계정 정보 메뉴에서 변경 가능한 항목을 확인해 주세요."),
            new FaqItem("고객센터", "고객센터 답변은 어디에서 확인하나요?", "고객센터 문의내역과 고객 알림에서 답변과 처리 상태를 확인할 수 있습니다."),
            new FaqItem("고객센터", "고객의 소리는 어떻게 남기나요?", "고객센터의 고객의 소리 탭에서 서비스 개선 의견을 접수할 수 있습니다."));

    private final SupportInquiryRepository inquiries;
    private final CustomerNotificationRepository notifications;
    private final UserRepository users;
    private final BusinessNotificationService businessNotifications;

    public CustomerSupportService(SupportInquiryRepository inquiries, CustomerNotificationRepository notifications, UserRepository users, BusinessNotificationService businessNotifications) {
        this.inquiries = inquiries;
        this.notifications = notifications;
        this.users = users;
        this.businessNotifications = businessNotifications;
    }

    public List<FaqItem> faqs() {
        return FAQS;
    }

    @Transactional
    public InquiryResponse createInquiry(CurrentUser user, CreateInquiryRequest request) {
        SupportInquiry inquiry = inquiries.save(new SupportInquiry(user.userId(), request.category().trim(), request.title().trim(), request.content().trim()));
        notifications.save(new CustomerNotification(user.userId(), "INQUIRY_RECEIVED", "문의가 접수되었습니다", "고객센터에서 답변을 준비하고 있습니다.", "/support"));
        businessNotifications.notifyAdmins("INQUIRY_SUBMITTED", "새 고객 문의가 접수되었습니다",
                inquiry.getTitle() + " 문의에 답변해 주세요.", "/admin");
        return InquiryResponse.from(inquiry);
    }

    public CustomerCenterResponse customerCenter(CurrentUser user) {
        List<InquiryResponse> myInquiries = inquiries.findByConsumerIdOrderByCreatedAtDesc(user.userId()).stream().map(InquiryResponse::from).toList();
        List<NotificationResponse> myNotifications = notifications.findTop50ByUserIdOrderByCreatedAtDesc(user.userId()).stream().map(NotificationResponse::from).toList();
        return new CustomerCenterResponse(FAQS, myInquiries, myNotifications);
    }

    @Transactional
    public void markNotificationRead(CurrentUser user, Long notificationId) {
        CustomerNotification notification = notifications.findById(notificationId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "알림을 찾을 수 없습니다."));
        if (!notification.getUserId().equals(user.userId())) throw new DomainException(ErrorCode.FORBIDDEN, "다른 사용자의 알림은 읽음 처리할 수 없습니다.");
        notification.markRead();
    }

    public List<AdminInquiryResponse> adminInquiries(CurrentUser admin, SupportInquiryStatus status) {
        requireAdmin(admin);
        Map<Long, String> consumerNames = users.findAll().stream().collect(Collectors.toMap(User::getId, User::getName));
        List<SupportInquiry> result = status == null ? inquiries.findAllByOrderByCreatedAtDesc() : inquiries.findByStatusOrderByCreatedAtDesc(status);
        return result.stream().map(inquiry -> new AdminInquiryResponse(inquiry.getId(), inquiry.getConsumerId(),
                consumerNames.getOrDefault(inquiry.getConsumerId(), "고객"), inquiry.getCategory(), inquiry.getTitle(), inquiry.getContent(),
                inquiry.getStatus(), inquiry.getAdminReply(), inquiry.getAnsweredAt(), inquiry.getCreatedAt(), inquiry.getUpdatedAt())).toList();
    }

    @Transactional
    public AdminInquiryResponse reply(CurrentUser admin, Long inquiryId, ReplyInquiryRequest request) {
        requireAdmin(admin);
        SupportInquiry inquiry = getInquiry(inquiryId);
        inquiry.answer(admin.userId(), request.reply().trim());
        notifications.save(new CustomerNotification(inquiry.getConsumerId(), "INQUIRY_ANSWERED", "고객센터 답변이 등록되었습니다", inquiry.getTitle(), "/support"));
        return toAdminResponse(inquiry);
    }

    @Transactional
    public AdminInquiryResponse changeStatus(CurrentUser admin, Long inquiryId, ChangeInquiryStatusRequest request) {
        requireAdmin(admin);
        SupportInquiry inquiry = getInquiry(inquiryId);
        inquiry.changeStatus(request.status());
        if (request.status() == SupportInquiryStatus.CLOSED) {
            notifications.save(new CustomerNotification(inquiry.getConsumerId(), "INQUIRY_CLOSED", "문의 처리가 완료되었습니다", inquiry.getTitle(), "/support"));
        }
        return toAdminResponse(inquiry);
    }

    private SupportInquiry getInquiry(Long inquiryId) {
        return inquiries.findById(inquiryId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "문의를 찾을 수 없습니다."));
    }

    private AdminInquiryResponse toAdminResponse(SupportInquiry inquiry) {
        String consumerName = users.findById(inquiry.getConsumerId()).map(User::getName).orElse("고객");
        return new AdminInquiryResponse(inquiry.getId(), inquiry.getConsumerId(), consumerName, inquiry.getCategory(), inquiry.getTitle(), inquiry.getContent(),
                inquiry.getStatus(), inquiry.getAdminReply(), inquiry.getAnsweredAt(), inquiry.getCreatedAt(), inquiry.getUpdatedAt());
    }

    private void requireAdmin(CurrentUser user) {
        if (!user.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다.");
    }
}
