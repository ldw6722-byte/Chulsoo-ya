package com.chulsooya.server.domain.user;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.support.CurrentUser;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final UserRepository users;

    public AdminUserController(UserRepository users) {
        this.users = users;
    }

    @GetMapping
    public ApiResponse<List<UserResponse>> list(CurrentUser actor) {
        requireAdmin(actor);
        return ApiResponse.of(users.findAll().stream().map(UserResponse::from).toList());
    }

    @PatchMapping("/{userId}/role")
    public ApiResponse<UserResponse> changeRole(CurrentUser actor, @PathVariable Long userId, @RequestBody RoleRequest request) {
        requireAdmin(actor);
        User user = users.findById(userId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "회원 정보를 찾을 수 없습니다."));
        if (user.getRole() == UserRole.ADMIN) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 계정 역할은 변경할 수 없습니다.");
        if (request.role() != UserRole.CONSUMER && request.role() != UserRole.SELLER) throw new DomainException(ErrorCode.VALIDATION_FAILED, "소비자 또는 판매자 역할만 선택할 수 있습니다.");
        user.changeRole(request.role());
        return ApiResponse.of(UserResponse.from(user));
    }

    private void requireAdmin(CurrentUser actor) {
        if (!actor.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다.");
    }

    public record RoleRequest(UserRole role) {}
    public record UserResponse(Long id, String email, String name, UserRole role) {
        static UserResponse from(User user) { return new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole()); }
    }
}
