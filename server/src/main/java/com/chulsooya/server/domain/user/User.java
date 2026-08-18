package com.chulsooya.server.domain.user;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Supabase Auth JWT의 sub(UUID). 기존 플랫폼 PK와 분리해 외래 키를 보존한다. */
    @Column(name = "supabase_user_id", unique = true)
    private UUID supabaseUserId;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public User(String email, String name, String phone, UserRole role) {
        this.email = email;
        this.name = name;
        this.phone = phone;
        this.role = role;
    }

    public static User fromSupabase(UUID supabaseUserId, String email, String name) {
        User user = new User(email, name, null, UserRole.CONSUMER);
        user.supabaseUserId = supabaseUserId;
        return user;
    }

    /** 인증 제공자는 이메일만 동기화한다. 회원이 직접 저장한 표시 이름은 보존한다. */
    public void refreshSupabaseProfile(String email, String name) {
        this.email = email;
        if ((this.name == null || this.name.isBlank()) && name != null && !name.isBlank()) this.name = name.trim();
    }
    public void updateMemberProfile(String name, String phone) {
        this.name = name.trim();
        this.phone = phone.trim();
    }

    public void linkSupabaseIdentity(UUID supabaseUserId) {
        this.supabaseUserId = supabaseUserId;
    }

    /** 관리자만 소비자·판매자 역할을 전환한다. ADMIN 승격은 별도 운영 절차로 제한한다. */
    /** 환경 설정으로 지정된 초기 슈퍼어드민에만 사용하는 부트스트랩 경로다. */
    public void grantAdministratorForBootstrap() {
        this.role = UserRole.ADMIN;
    }
    public void changeRole(UserRole role) {
        if (role == UserRole.ADMIN) throw new IllegalArgumentException("관리자 역할은 이 경로에서 변경할 수 없습니다.");
        this.role = role;
    }
}
