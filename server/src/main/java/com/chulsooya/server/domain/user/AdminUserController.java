package com.chulsooya.server.domain.user;

import java.time.Instant;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.store.StoreRepository;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final UserRepository users;
    private final StoreRepository stores;
    private final FeaturePermissionService featurePermissions;
    private final AdministratorRoleService administratorRoles;
    public AdminUserController(UserRepository users, StoreRepository stores, FeaturePermissionService featurePermissions,
            AdministratorRoleService administratorRoles) {
        this.users = users;
        this.stores = stores;
        this.featurePermissions = featurePermissions;
        this.administratorRoles = administratorRoles;
    }

    @GetMapping
    public ApiResponse<List<UserResponse>> list(CurrentUser actor) {
        featurePermissions.requireAny(actor, FeaturePermission.ADMIN_MANAGE_CONSUMERS, FeaturePermission.ADMIN_MANAGE_SELLERS);
        return ApiResponse.of(users.findAll().stream().map(UserResponse::from).toList());
    }

    @GetMapping("/{userId}/permissions")
    public ApiResponse<List<FeaturePermissionService.PermissionView>> permissions(CurrentUser actor, @PathVariable Long userId) {
        return ApiResponse.of(featurePermissions.list(actor, userId));
    }

    @PatchMapping("/{userId}/permissions/{permission}")
    public ApiResponse<FeaturePermissionService.PermissionView> changePermission(CurrentUser actor, @PathVariable Long userId,
            @PathVariable FeaturePermission permission, @RequestBody PermissionRequest request) {
        return ApiResponse.of(featurePermissions.change(actor, userId, permission, request.enabled()));
    }

        @PatchMapping("/{userId}/administrator")
    public ApiResponse<UserResponse> changeAdministrator(CurrentUser actor, @PathVariable Long userId,
            @RequestBody AdministratorRequest request) {
        return ApiResponse.of(UserResponse.from(administratorRoles.changeStandardAdministrator(actor, userId, request.enabled())));
    }

    /** 판매자 활성은 승인된 판매점이 있는 계정에만 허용한다. 판매자 해지는 전용 신청 승인 API를 사용한다. */

    @Transactional
    @PatchMapping("/{userId}/role")
    public ApiResponse<UserResponse> changeRole(CurrentUser actor, @PathVariable Long userId, @RequestBody RoleRequest request) {
                featurePermissions.require(actor, FeaturePermission.ADMIN_MANAGE_SELLERS);
        User user = users.findById(userId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "회원 정보를 찾을 수 없습니다."));

        if (user.getRole() == UserRole.ADMIN) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 계정 역할은 변경할 수 없습니다.");
        if (request.role() != UserRole.CONSUMER && request.role() != UserRole.SELLER) throw new DomainException(ErrorCode.VALIDATION_FAILED, "소비자 또는 판매자 역할만 선택할 수 있습니다.");
        if (request.role() == UserRole.SELLER) {
            var store = stores.findByOwnerId(userId).orElseThrow(() -> new DomainException(ErrorCode.VALIDATION_FAILED, "판매자 역할은 승인된 판매점과 함께 활성화해야 합니다."));
            if (!store.isVerified()) throw new DomainException(ErrorCode.VALIDATION_FAILED, "검증된 판매점만 판매자 역할을 활성화할 수 있습니다.");
            store.changeOperatingStatus(true, true);
            stores.save(store);
        } else if (user.getRole() == UserRole.SELLER) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "판매자 일반 회원 전환은 등록 해지 신청 승인으로 처리해야 합니다.");
        }
        user.changeRole(request.role());
        users.save(user);
        return ApiResponse.of(UserResponse.from(user));
    }

        public record RoleRequest(UserRole role) {}
    public record AdministratorRequest(boolean enabled) {}
    public record PermissionRequest(boolean enabled) {}
    public record UserResponse(Long id, String email, String name, String phone, UserRole role, AdminLevel adminLevel, Instant createdAt) {
        static UserResponse from(User user) { return new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getPhone(), user.getRole(), user.getAdminLevel(), user.getCreatedAt()); }
    }

}
