package com.chulsooya.server.domain.admin;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.user.AdminLevel;
import com.chulsooya.server.domain.user.AdminStatus;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.domain.support.BusinessNotificationService;
import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class AdminAccountService {
    private final UserRepository users;
    private final SupabaseAdminInvitationClient invitations;
    private final BusinessNotificationService notifications;

    public AdminAccountService(UserRepository users, SupabaseAdminInvitationClient invitations,
            BusinessNotificationService notifications) {
        this.users = users;
        this.invitations = invitations;
        this.notifications = notifications;
    }

    public AdminAccountDtos.AccountResponse me(CurrentUser currentUser) {
        return response(requireAdministrator(currentUser));
    }

    @Transactional
    public AdminAccountDtos.AccountResponse updateMyStatus(CurrentUser currentUser, AdminAccountDtos.StatusUpdateRequest request) {
        if (request == null || request.status() == null) throw new DomainException(ErrorCode.VALIDATION_FAILED, "운영 상태를 선택해 주세요.");
        User account = requireAdministrator(currentUser);
        account.updateAdministratorStatus(request.status());
        User saved = users.save(account);
        notifications.notifyHighestAdmins("ADMIN_STATUS_CHANGED", "관리자 운영 상태가 변경되었습니다",
                saved.getName() + " 관리자의 상태가 " + statusLabel(saved.getAdminStatus()) + "으로 변경되었습니다.", "/admin");
        return response(saved);
    }

    public AdminAccountDtos.AccountListResponse list(CurrentUser currentUser) {
        requireHighestAdministrator(currentUser);
        List<AdminAccountDtos.AccountResponse> accounts = users.findByRole(UserRole.ADMIN).stream()
                .filter(account -> account.getAdminLevel() != AdminLevel.NONE)
                .sorted(Comparator.comparing(User::getAdminLevel).thenComparing(User::getEmail))
                .map(this::response)
                .toList();
        return new AdminAccountDtos.AccountListResponse(accounts);
    }

    @Transactional
    public AdminAccountDtos.AccountResponse inviteStandardAdministrator(CurrentUser currentUser, AdminAccountDtos.InviteRequest request) {
        requireHighestAdministrator(currentUser);
        if (request == null || request.email() == null || request.email().isBlank() || request.name() == null || request.name().isBlank()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "이름과 이메일을 입력해 주세요.");
        }
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.findByEmail(email).isPresent()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "이미 등록된 이메일입니다.");
        }
        User account = new User(email, request.name().trim(), null, UserRole.ADMIN);
        account.grantStandardAdministrator();
        users.save(account);
        invitations.invite(email, account.getName());
        notifications.notifyHighestAdmins("ADMIN_ACCOUNT_CREATED", "일반 관리자 계정을 추가했습니다",
                account.getName() + " 관리자 계정을 확인해 주세요.", "/admin");
        return response(account);
    }

    private User requireAdministrator(CurrentUser currentUser) {
        if (currentUser == null || !currentUser.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN);
        User account = users.findById(currentUser.userId()).orElseThrow(() -> new DomainException(ErrorCode.FORBIDDEN));
        if (account.getRole() != UserRole.ADMIN) throw new DomainException(ErrorCode.FORBIDDEN);
        return account;
    }

    private User requireHighestAdministrator(CurrentUser currentUser) {
        User account = requireAdministrator(currentUser);
        if (!account.isHighestAdministrator()) throw new DomainException(ErrorCode.FORBIDDEN, "최고 관리자만 일반 관리자 계정을 관리할 수 있습니다.");
        return account;
    }

    private AdminAccountDtos.AccountResponse response(User account) {
        return new AdminAccountDtos.AccountResponse(account.getId(), account.getEmail(), account.getName(),
                levelLabel(account.getAdminLevel()), statusLabel(account.getAdminStatus()),
                account.getAdminLevel(), account.getAdminStatus(), account.getAdminStatusUpdatedAt());
    }

    private static String levelLabel(AdminLevel level) {
        return level == AdminLevel.HIGHEST ? "최고 관리자" : "일반 관리자";
    }

    private static String statusLabel(AdminStatus status) {
        return switch (status) {
            case WORKING -> "근무 중";
            case AWAY -> "자리 비움";
            case OFFLINE -> "업무 종료";
        };
    }
}
