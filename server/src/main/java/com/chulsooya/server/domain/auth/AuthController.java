package com.chulsooya.server.domain.auth;

import java.util.Map;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.user.AdminLevel;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRole;

/** Supabase access token 검증을 통과한 사용자만 접근 가능한 자기 프로필 API. */
@RestController
@Profile("supabase")
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthUserService authUserService;

    public AuthController(AuthUserService authUserService) {
        this.authUserService = authUserService;
    }

    @GetMapping("/me")
    public ApiResponse<AuthUserResponse> me(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) throw new DomainException(ErrorCode.FORBIDDEN, "로그인 세션이 필요합니다.");
        User user = authUserService.synchronize(subject(jwt), jwt.getClaimAsString("email"), displayName(jwt));
        return ApiResponse.of(AuthUserResponse.from(user));
    }

    private UUID subject(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException exception) {
            throw new DomainException(ErrorCode.FORBIDDEN, "Supabase 사용자 식별자가 올바르지 않습니다.");
        }
    }

    private String displayName(Jwt jwt) {
        Map<String, Object> metadata = jwt.getClaimAsMap("user_metadata");
        if (metadata == null) return null;
        Object name = metadata.getOrDefault("name", metadata.get("full_name"));
        return name instanceof String value ? value : null;
    }

    public record AuthUserResponse(Long id, UUID supabaseUserId, String email, String name, UserRole role, AdminLevel adminLevel) {
        static AuthUserResponse from(User user) {
            return new AuthUserResponse(user.getId(), user.getSupabaseUserId(), user.getEmail(), user.getName(), user.getRole(), user.getAdminLevel());
        }
    }
}
