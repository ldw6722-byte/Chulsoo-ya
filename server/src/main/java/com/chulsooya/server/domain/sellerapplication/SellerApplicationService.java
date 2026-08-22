package com.chulsooya.server.domain.sellerapplication;

import static com.chulsooya.server.domain.sellerapplication.SellerApplicationDtos.AdminResponse;
import static com.chulsooya.server.domain.sellerapplication.SellerApplicationDtos.ApplicantResponse;
import static com.chulsooya.server.domain.sellerapplication.SellerApplicationDtos.SubmitRequest;

import java.time.Clock;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.region.ServiceRegionService;

import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.store.SubscriptionTier;
import com.chulsooya.server.domain.user.FeaturePermission;
import com.chulsooya.server.domain.user.FeaturePermissionService;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.domain.support.BusinessNotificationService;

import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class SellerApplicationService {

    private final SellerApplicationRepository applications;
    private final StoreRepository stores;
    private final UserRepository users;
    private final Clock clock;
    private final BusinessNotificationService notifications;
    private final FeaturePermissionService permissions;
    private final ServiceRegionService regions;

        public SellerApplicationService(SellerApplicationRepository applications, StoreRepository stores,
            UserRepository users, Clock clock, BusinessNotificationService notifications, FeaturePermissionService permissions,
            ServiceRegionService regions) {

        this.applications = applications;
        this.stores = stores;
        this.users = users;
                this.clock = clock;
        this.notifications = notifications;
        this.permissions = permissions;
        this.regions = regions;

    }

    @Transactional
    public ApplicantResponse submit(CurrentUser actor, SubmitRequest request) {
        User applicant = users.findById(actor.userId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "회원 정보를 찾을 수 없습니다."));
        if (applicant.getRole() == UserRole.ADMIN) {
            throw new DomainException(ErrorCode.FORBIDDEN, "관리자 계정은 관리자 전용 판매자 신청을 사용해 주세요.");
        }
        if (applicant.getRole() != UserRole.CONSUMER) {
            throw new DomainException(ErrorCode.FORBIDDEN, "일반 회원 계정에서만 판매자 신청을 제출할 수 있습니다.");
        }
        if (applications.findByApplicantId(actor.userId()).isPresent()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "이미 판매자 신청이 접수되어 있습니다.");
        }
        ServiceRegionService.RegionView region = regions.resolveAddress(request.address());
        SellerApplication application = new SellerApplication(applicant, request.storeName(), request.representativeName(),
                request.businessRegistrationNumber(), region.cityName(), region.districtName(), region.code(),
                request.address(), request.phone(), request.handledItems());
                application.setBusinessOpenedOn(request.businessOpenedOn());
        SellerApplication saved = applications.save(application);
        notifications.notifyAdmins("SELLER_APPLICATION_SUBMITTED", "새 판매자 신청이 접수되었습니다",
                saved.getStoreName() + " 판매자 신청을 심사해 주세요.", "/admin");
        return ApplicantResponse.from(saved);

    }

    /** 최고관리자 또는 권한을 받은 일반관리자의 내부 판매자 기능 검증 신청. */
    @Transactional
    public ApplicantResponse submitInternalAdministratorApplication(CurrentUser actor) {
        User applicant = users.findById(actor.userId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "회원 정보를 찾을 수 없습니다."));
        if (!canSubmitInternalAdministratorApplication(actor, applicant)) {
            throw new DomainException(ErrorCode.FORBIDDEN, "관리자 판매자 신청 권한이 없습니다.");
        }
        if (applications.findByApplicantId(actor.userId()).isPresent()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "이미 판매자 신청이 접수되어 있습니다.");
        }
        SellerApplication saved = applications.save(SellerApplication.internalAdministrator(applicant));
        notifications.notifyAdmins("INTERNAL_ADMIN_SELLER_APPLICATION_SUBMITTED", "관리자 판매자 신청이 접수되었습니다",
                applicant.getName() + " 관리자 계정의 내부 판매자 기능 승인을 검토해 주세요.", "/admin");
        return ApplicantResponse.from(saved);
    }

    public ApplicantResponse mine(CurrentUser actor) {
        return applications.findByApplicantId(actor.userId()).map(ApplicantResponse::from)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "제출한 판매자 신청이 없습니다."));
    }

    public List<AdminResponse> adminList(CurrentUser actor, SellerApplicationStatus status) {
        requireSellerApplicationReview(actor);
        return (status == null ? applications.findAllByOrderBySubmittedAtAsc() : applications.findAllByStatusOrderBySubmittedAtAsc(status)).stream()
                .map(AdminResponse::from).toList();
    }

    @Transactional
    public ApplicantResponse approve(CurrentUser actor, Long applicationId) {
        requireSellerApplicationReview(actor);
        SellerApplication application = requireApplicationForUpdate(applicationId);
        if (application.isInternalAdminApplication() && !isHighestAdministrator(actor)) {
            throw new DomainException(ErrorCode.FORBIDDEN, "관리자 판매자 신청의 강제 승인은 최고관리자만 할 수 있습니다.");
        }
        if (application.requiresVerificationDocuments()
                && (application.getCertificateObjectKey() == null || application.getBankAccountCopyObjectKey() == null)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "사업자등록증과 통장사본을 먼저 제출해 주세요.");
        }
        if (stores.findByOwnerId(application.getApplicant().getId()).isPresent()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "이미 판매점이 등록된 계정입니다.");
        }

        application.approve(actor.userId(), clock.instant());
        if (application.getApplicant().getRole() != UserRole.ADMIN) {
            application.getApplicant().changeRole(UserRole.SELLER);
        }
        Store store = application.isInternalAdminApplication()
                ? internalAdministratorStore(application)
                : new Store(application.getApplicant(), application.getStoreName(), application.getGuCode(),
                        application.getAddress(), application.getPhone(), SubscriptionTier.SILVER);
        if (application.isInternalAdminApplication()) {
            store.changeCustomerDisplaySettings(null, null, false);
        } else {
            store.changeDirectoryProfile(application.getStoreName(), application.getCityName(), application.getDistrictName(),
                    application.getGuCode(), application.getAddress(), application.getPhone(), null, application.getHandledItems());
        }
        store.changeOperatingStatus(true, true);
                stores.save(store);
        notifications.notifyUser(application.getApplicant().getId(), "SELLER_APPLICATION_APPROVED", "판매자 신청이 승인되었습니다",
                "판매자 운영과 응찰 기능을 이용할 수 있습니다.", "/seller");
        return ApplicantResponse.from(application);

    }

    @Transactional
    public AdminResponse reject(CurrentUser actor, Long applicationId, String reason) {
        requireSellerApplicationReview(actor);
        SellerApplication application = requireApplicationForUpdate(applicationId);
                application.reject(actor.userId(), reason, clock.instant());
        notifications.notifyUser(application.getApplicant().getId(), "SELLER_APPLICATION_REJECTED", "판매자 신청 심사 결과를 확인해 주세요",
                reason == null || reason.isBlank() ? "신청이 반려되었습니다." : reason.trim(), "/seller/application");
        return AdminResponse.from(application);

    }

    @Transactional
    SellerApplication requireApplicationForUpdate(Long applicationId) {
        return applications.findByIdForUpdate(applicationId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매자 신청을 찾을 수 없습니다."));
    }

    private boolean canSubmitInternalAdministratorApplication(CurrentUser actor, User applicant) {
        if (applicant.getRole() != UserRole.ADMIN) return false;
        return applicant.isHighestAdministrator()
                || permissions.has(actor, FeaturePermission.CONSUMER_SELLER_APPLICATION);
    }

    private boolean isHighestAdministrator(CurrentUser actor) {
        return users.findById(actor.userId()).map(User::isHighestAdministrator).orElse(false);
    }

    private Store internalAdministratorStore(SellerApplication application) {
        String phone = application.getApplicant().getPhone() == null ? "000-0000-0000" : application.getApplicant().getPhone();
        Store store = new Store(application.getApplicant(), application.getStoreName(), "INTERNAL",
                "내부 관리자 판매자 기능 테스트", phone, SubscriptionTier.SILVER);
        store.changeDirectoryProfile(application.getStoreName(), "시스템 내부", "관리자 테스트", "INTERNAL",
                "내부 관리자 판매자 기능 테스트", phone, null, application.getHandledItems());
        return store;
    }

    private void requireSellerApplicationReview(CurrentUser actor) {
        requireAdmin(actor);
        if (!isHighestAdministrator(actor)) {
            permissions.require(actor, FeaturePermission.ADMIN_REVIEW_SELLER_APPLICATIONS);
        }
    }

    private void requireAdmin(CurrentUser actor) {
        if (!actor.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다.");
    }

    

}
