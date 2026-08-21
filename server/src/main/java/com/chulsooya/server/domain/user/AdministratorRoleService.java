package com.chulsooya.server.domain.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional
public class AdministratorRoleService {
    private final UserRepository users;
    private final FeaturePermissionService featurePermissions;
    private final AdministratorRoleAuditLogRepository audits;

    public AdministratorRoleService(UserRepository users, FeaturePermissionService featurePermissions,
            AdministratorRoleAuditLogRepository audits) {
        this.users = users;
        this.featurePermissions = featurePermissions;
        this.audits = audits;
    }

    public User changeStandardAdministrator(CurrentUser actor, Long targetUserId, boolean enabled) {
        User actorUser = user(actor.userId());
        if (!actorUser.isHighestAdministrator()) {
            throw new DomainException(ErrorCode.FORBIDDEN, "최고관리자만 일반관리자 권한을 부여하거나 해지할 수 있습니다.");
        }
        User target = user(targetUserId);
        if (target.getId().equals(actor.userId()) || target.isHighestAdministrator()) {
            throw new DomainException(ErrorCode.FORBIDDEN, "본인 또는 최고관리자 권한은 변경할 수 없습니다.");
        }

        UserRole previousRole = target.getRole();
        AdminLevel previousLevel = target.getAdminLevel();
        AdministratorRoleAction action;
        if (enabled) {
            if (target.getRole() != UserRole.CONSUMER) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "일반 회원 계정만 일반관리자로 지정할 수 있습니다.");
            }
            target.grantStandardAdministrator();
            action = AdministratorRoleAction.GRANT_STANDARD;
        } else {
            if (target.getRole() != UserRole.ADMIN || target.getAdminLevel() != AdminLevel.STANDARD) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "일반관리자 계정만 관리자 권한을 해지할 수 있습니다.");
            }
            featurePermissions.revokeAdministratorPermissions(actor.userId(), target);
            target.revokeStandardAdministrator();
            action = AdministratorRoleAction.REVOKE_STANDARD;
        }

        users.save(target);
        audits.save(new AdministratorRoleAuditLog(actor.userId(), target.getId(), action,
                previousRole, previousLevel, target.getRole(), target.getAdminLevel()));
        return target;
    }

    private User user(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "회원 정보를 찾을 수 없습니다."));
    }
}
