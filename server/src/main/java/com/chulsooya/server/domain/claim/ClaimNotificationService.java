package com.chulsooya.server.domain.claim;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.support.CustomerNotification;
import com.chulsooya.server.domain.support.CustomerNotificationRepository;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;

/** 푸시·알림톡 외부 발송 전에도 역할별 수신 이력을 먼저 보존한다. */
@Service
@Transactional
public class ClaimNotificationService {

    private final CustomerNotificationRepository notifications;
    private final StoreRepository stores;
    private final UserRepository users;

    public ClaimNotificationService(CustomerNotificationRepository notifications, StoreRepository stores,
            UserRepository users) {
        this.notifications = notifications;
        this.stores = stores;
        this.users = users;
    }

    public void requested(Claim claim) {
        notifications.save(new CustomerNotification(claim.getConsumerId(), "CLAIM_REQUESTED",
                "클레임이 접수되었습니다", "처리 결과가 확정될 때까지 거래 정산이 보류됩니다.",
                "/orders/" + claim.getOrderId()));
        stores.findById(claim.getStoreId()).map(store -> store.getOwner().getId()).ifPresent(ownerId ->
                notifications.save(new CustomerNotification(ownerId, "SELLER_CLAIM_REQUESTED",
                        "새로운 클레임 요청이 접수되었습니다", "주문 #" + claim.getOrderId() + "의 처리 내용을 확인해 주세요.",
                        "/seller/claims")));
        users.findByRole(UserRole.ADMIN).forEach(admin -> notifications.save(new CustomerNotification(admin.getId(),
                "ADMIN_CLAIM_REQUESTED", "새 클레임 운영 확인", "주문 #" + claim.getOrderId() + " 클레임이 접수되었습니다.",
                "/admin")));
    }

    public void updated(Claim claim, String message) {
        notifications.save(new CustomerNotification(claim.getConsumerId(), "CLAIM_UPDATED", "클레임 처리 상태가 변경되었습니다",
                message, "/orders/" + claim.getOrderId()));
    }
}
