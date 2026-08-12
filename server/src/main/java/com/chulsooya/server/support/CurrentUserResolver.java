package com.chulsooya.server.support;

import java.util.Map;
import java.util.UUID;

import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.auth.AuthUserService;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRole;

@Component
public class CurrentUserResolver implements HandlerMethodArgumentResolver {

    private static final String HEADER_USER_ID = "X-User-Id";
    private static final String HEADER_USER_ROLE = "X-User-Role";

    private final AuthUserService authUserService;

    public CurrentUserResolver(AuthUserService authUserService) {
        this.authUserService = authUserService;
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return CurrentUser.class.equals(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {

        Jwt jwt = authenticatedJwt();
        if (jwt != null) return fromSupabaseJwt(jwt);
        return fromDevelopmentHeaders(webRequest);
    }

    private CurrentUser fromSupabaseJwt(Jwt jwt) {
        try {
            UUID subject = UUID.fromString(jwt.getSubject());
            User user = authUserService.synchronize(subject, jwt.getClaimAsString("email"), displayName(jwt));
            return new CurrentUser(user.getId(), user.getRole());
        } catch (IllegalArgumentException exception) {
            throw new DomainException(ErrorCode.FORBIDDEN, "Supabase 사용자 식별자가 올바르지 않습니다.");
        }
    }

    private Jwt authenticatedJwt() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getPrincipal() instanceof Jwt jwt ? jwt : null;
    }

    private CurrentUser fromDevelopmentHeaders(NativeWebRequest webRequest) {
        // ponytail: local 프로파일 E2E·시드 계정을 위한 fallback. supabase 프로파일에서는 Security가 Bearer JWT를 강제한다.
        String rawId = webRequest.getHeader(HEADER_USER_ID);
        String rawRole = webRequest.getHeader(HEADER_USER_ROLE);
        if (rawId == null || rawId.isBlank()) {
            throw new DomainException(ErrorCode.FORBIDDEN, "인증 정보가 없습니다.");
        }
        try {
            UserRole role = rawRole == null || rawRole.isBlank()
                    ? UserRole.CONSUMER
                    : UserRole.valueOf(rawRole.trim().toUpperCase());
            return new CurrentUser(Long.valueOf(rawId.trim()), role);
        } catch (IllegalArgumentException exception) {
            throw new DomainException(ErrorCode.FORBIDDEN, "인증 정보 형식이 올바르지 않습니다.");
        }
    }

    private String displayName(Jwt jwt) {
        Map<String, Object> metadata = jwt.getClaimAsMap("user_metadata");
        if (metadata == null) return null;
        Object name = metadata.getOrDefault("name", metadata.get("full_name"));
        return name instanceof String value ? value : null;
    }
}
