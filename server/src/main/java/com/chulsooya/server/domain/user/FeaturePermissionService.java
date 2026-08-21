package com.chulsooya.server.domain.user;

import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class FeaturePermissionService {
    private final UserRepository users;
    private final UserFeaturePermissionRepository permissions;
    private final PermissionAuditLogRepository audits;

    public FeaturePermissionService(UserRepository users, UserFeaturePermissionRepository permissions,
            PermissionAuditLogRepository audits) {
        this.users = users;
        this.permissions = permissions;
        this.audits = audits;
    }

    public boolean has(CurrentUser actor, FeaturePermission permission) {
        User user = user(actor.userId());
        return user.isHighestAdministrator()
                || permissions.existsByUserIdAndPermissionCodeAndEnabledTrue(user.getId(), permission);
    }

    public void require(CurrentUser actor, FeaturePermission permission) {
        if (!has(actor, permission)) {
            throw new DomainException(ErrorCode.FORBIDDEN, "이 기능에 대한 접근 권한이 없습니다.");
        }
    }

    public void requireAny(CurrentUser actor, FeaturePermission... required) {
        for (FeaturePermission permission : required) {
            if (has(actor, permission)) return;
        }
        throw new DomainException(ErrorCode.FORBIDDEN, "이 기능에 대한 접근 권한이 없습니다.");
    }

    public List<PermissionView> list(CurrentUser actor, Long targetUserId) {
        User target = user(targetUserId);
        requireTargetRead(actor, target);
        return Arrays.stream(FeaturePermission.values())
                .filter(permission -> appliesTo(target, permission))
                .map(permission -> {
                    var stored = permissions.findByUserIdAndPermissionCode(target.getId(), permission).orElse(null);
                    return new PermissionView(permission, permission.getLabel(), permission.getGroup().name(),
                            stored != null && stored.isEnabled());
                }).toList();
    }

    @Transactional
    public PermissionView change(CurrentUser actor, Long targetUserId, FeaturePermission permission, boolean enabled) {
        User target = user(targetUserId);
        requireTargetWrite(actor, target, permission);
        UserFeaturePermission stored = permissions.findByUserIdAndPermissionCode(target.getId(), permission).orElse(null);
        Boolean previous = stored == null ? null : stored.isEnabled();
        if (stored == null) {
            stored = permissions.save(new UserFeaturePermission(target.getId(), permission, enabled, actor.userId()));
        } else {
            stored.change(enabled, actor.userId());
        }
        audits.save(new PermissionAuditLog(actor.userId(), target.getId(), permission, previous, enabled));
        return new PermissionView(permission, permission.getLabel(), permission.getGroup().name(), enabled);
    }

    /** 일반관리자 해지와 동시에 관리자 기능 토글을 모두 회수하고 기존 감사 이력에도 남긴다. */
    @Transactional
    public void revokeAdministratorPermissions(Long actorUserId, User target) {
        permissions.findByUserIdOrderByPermissionCodeAsc(target.getId()).stream()
                .filter(stored -> stored.getPermissionCode().getGroup() == FeaturePermission.PermissionGroup.ADMIN)
                .filter(UserFeaturePermission::isEnabled)
                .forEach(stored -> {
                    stored.change(false, actorUserId);
                    audits.save(new PermissionAuditLog(actorUserId, target.getId(), stored.getPermissionCode(), true, false));
                });
    }

    private void requireTargetRead(CurrentUser actor, User target) {
        User actorUser = user(actor.userId());
        if (actorUser.isHighestAdministrator()) return;
        if (target.getId().equals(actor.userId()) && actorUser.getRole() == UserRole.ADMIN) return;
        if (actorUser.getRole() != UserRole.ADMIN || target.getRole() == UserRole.ADMIN) {
            throw new DomainException(ErrorCode.FORBIDDEN, "회원 권한을 조회할 수 없습니다.");
        }
        require(actor, target.getRole() == UserRole.SELLER
                ? FeaturePermission.ADMIN_MANAGE_SELLERS : FeaturePermission.ADMIN_MANAGE_CONSUMERS);
    }

    private void requireTargetWrite(CurrentUser actor, User target, FeaturePermission permission) {
        User actorUser = user(actor.userId());
        if (target.getId().equals(actor.userId()) || target.isHighestAdministrator()) {
            throw new DomainException(ErrorCode.FORBIDDEN, "본인 또는 최고관리자 권한은 변경할 수 없습니다.");
        }
        if (!appliesTo(target, permission)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "대상 역할에 적용할 수 없는 권한입니다.");
        }
        if (actorUser.isHighestAdministrator()) return;
        if (actorUser.getRole() != UserRole.ADMIN || target.getRole() == UserRole.ADMIN
                || permission.getGroup() == FeaturePermission.PermissionGroup.ADMIN) {
            throw new DomainException(ErrorCode.FORBIDDEN, "일반관리자는 관리자 권한을 변경할 수 없습니다.");
        }
        require(actor, target.getRole() == UserRole.SELLER
                ? FeaturePermission.ADMIN_MANAGE_SELLERS : FeaturePermission.ADMIN_MANAGE_CONSUMERS);
    }

    private boolean appliesTo(User target, FeaturePermission permission) {
        return switch (target.getRole()) {
            case CONSUMER -> permission.getGroup() == FeaturePermission.PermissionGroup.CONSUMER;
            case SELLER -> permission.getGroup() == FeaturePermission.PermissionGroup.CONSUMER
                    || permission.getGroup() == FeaturePermission.PermissionGroup.SELLER;
            case ADMIN -> !target.isHighestAdministrator()
                    && permission.getGroup() == FeaturePermission.PermissionGroup.ADMIN;
        };
    }

    private User user(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "회원 정보를 찾을 수 없습니다."));
    }

    public record PermissionView(FeaturePermission code, String label, String group, boolean enabled) {}
}
