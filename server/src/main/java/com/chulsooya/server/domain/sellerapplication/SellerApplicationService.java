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
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.domain.store.SubscriptionTier;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class SellerApplicationService {

    private final SellerApplicationRepository applications;
    private final StoreRepository stores;
    private final UserRepository users;
    private final Clock clock;

    public SellerApplicationService(SellerApplicationRepository applications, StoreRepository stores,
            UserRepository users, Clock clock) {
        this.applications = applications;
        this.stores = stores;
        this.users = users;
        this.clock = clock;
    }

    @Transactional
    public ApplicantResponse submit(CurrentUser actor, SubmitRequest request) {
        if (actor.role() != UserRole.CONSUMER) {
            throw new DomainException(ErrorCode.FORBIDDEN, "일반 회원 계정에서만 판매자 신청을 제출할 수 있습니다.");
        }
        if (applications.findByApplicantId(actor.userId()).isPresent()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "이미 판매자 신청이 접수되어 있습니다.");
        }
        User applicant = users.findById(actor.userId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "회원 정보를 찾을 수 없습니다."));
        SellerApplication application = new SellerApplication(applicant, request.storeName(), request.representativeName(),
                request.businessRegistrationNumber(), request.cityName(), request.districtName(), guCode(request.districtName()),
                request.address(), request.phone(), request.handledItems());
        application.setBusinessOpenedOn(request.businessOpenedOn());
        return ApplicantResponse.from(applications.save(application));
    }

    public ApplicantResponse mine(CurrentUser actor) {
        return applications.findByApplicantId(actor.userId()).map(ApplicantResponse::from)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "제출한 판매자 신청이 없습니다."));
    }

    public List<AdminResponse> adminList(CurrentUser actor, SellerApplicationStatus status) {
        requireAdmin(actor);
        return (status == null ? applications.findAllByOrderBySubmittedAtAsc() : applications.findAllByStatusOrderBySubmittedAtAsc(status)).stream()
                .map(AdminResponse::from).toList();
    }

    @Transactional
    public ApplicantResponse approve(CurrentUser actor, Long applicationId) {
        requireAdmin(actor);
        SellerApplication application = requireApplicationForUpdate(applicationId);
        if (application.getCertificateObjectKey() == null) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "사업자등록증을 먼저 제출해 주세요.");
        }
        if (stores.findByOwnerId(application.getApplicant().getId()).isPresent()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "이미 판매점이 등록된 계정입니다.");
        }

        application.approve(actor.userId(), clock.instant());
        application.getApplicant().changeRole(UserRole.SELLER);
        Store store = new Store(application.getApplicant(), application.getStoreName(), application.getGuCode(),
                application.getAddress(), application.getPhone(), SubscriptionTier.SILVER);
        store.changeDirectoryProfile(application.getStoreName(), application.getCityName(), application.getDistrictName(),
                application.getGuCode(), application.getAddress(), application.getPhone(), null, application.getHandledItems());
        store.changeOperatingStatus(true, true);
        stores.save(store);
        return ApplicantResponse.from(application);
    }

    @Transactional
    public AdminResponse reject(CurrentUser actor, Long applicationId, String reason) {
        requireAdmin(actor);
        SellerApplication application = requireApplicationForUpdate(applicationId);
        application.reject(actor.userId(), reason, clock.instant());
        return AdminResponse.from(application);
    }

    @Transactional
    SellerApplication requireApplicationForUpdate(Long applicationId) {
        return applications.findByIdForUpdate(applicationId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매자 신청을 찾을 수 없습니다."));
    }

    private void requireAdmin(CurrentUser actor) {
        if (!actor.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다.");
    }

    private String guCode(String districtName) {
        return "GU_" + Integer.toHexString(districtName.trim().hashCode() & 0xFFFF).toUpperCase();
    }
}
