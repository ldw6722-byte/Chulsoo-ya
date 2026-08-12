package com.chulsooya.server.domain.auth;

import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;

@Service
@Transactional(readOnly = true)
public class AuthUserService {

    private final UserRepository userRepository;

    public AuthUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User synchronize(UUID supabaseUserId, String rawEmail, String rawName) {
        String email = requireEmail(rawEmail);
        String name = normalizeName(rawName, email);

        return userRepository.findBySupabaseUserId(supabaseUserId)
                .map(user -> refresh(user, email, name))
                .orElseGet(() -> userRepository.findByEmail(email)
                        .map(user -> linkExisting(user, supabaseUserId, email, name))
                        .orElseGet(() -> userRepository.save(User.fromSupabase(supabaseUserId, email, name))));
    }

    private User refresh(User user, String email, String name) {
        user.refreshSupabaseProfile(email, name);
        return user;
    }

    private User linkExisting(User user, UUID supabaseUserId, String email, String name) {
        if (user.getSupabaseUserId() != null && !user.getSupabaseUserId().equals(supabaseUserId)) {
            throw new DomainException(ErrorCode.FORBIDDEN, "이미 다른 인증 계정에 연결된 이메일입니다.");
        }
        user.linkSupabaseIdentity(supabaseUserId);
        user.refreshSupabaseProfile(email, name);
        return user;
    }

    private String requireEmail(String rawEmail) {
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "인증 제공자에서 이메일 정보를 받지 못했습니다.");
        }
        return rawEmail.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeName(String rawName, String email) {
        if (rawName != null && !rawName.isBlank()) return rawName.trim();
        return email.substring(0, email.indexOf('@'));
    }
}
