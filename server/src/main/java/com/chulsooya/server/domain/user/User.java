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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AdminLevel adminLevel = AdminLevel.NONE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AdminStatus adminStatus = AdminStatus.OFFLINE;

    private Instant adminStatusUpdatedAt;

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
    public void grantAdministratorForBootstrap() {
        grantHighestAdministratorForBootstrap();
    }

    /** 환경 설정으로 지정된 최초 최고 관리자에만 사용하는 부트스트랩 경로다. */
    public void grantHighestAdministratorForBootstrap() {
        this.role = UserRole.ADMIN;
        this.adminLevel = AdminLevel.HIGHEST;
        updateAdministratorStatus(AdminStatus.WORKING);
    }

    /** 최고 관리자 초대로 생성되는 일반 관리자 권한이다. */
    public void grantStandardAdministrator() {
        this.role = UserRole.ADMIN;
        this.adminLevel = AdminLevel.STANDARD;
        updateAdministratorStatus(AdminStatus.OFFLINE);
    }

    public boolean isHighestAdministrator() {
        return role == UserRole.ADMIN && adminLevel == AdminLevel.HIGHEST;
    }

    /** 최고관리자만 일반관리자 인사 권한을 회수할 수 있다. */
    public void revokeStandardAdministrator() {
        if (role != UserRole.ADMIN || adminLevel != AdminLevel.STANDARD) {
            throw new IllegalArgumentException("일반관리자 계정만 해지할 수 있습니다.");
        }
        this.role = UserRole.CONSUMER;
        this.adminLevel = AdminLevel.NONE;
        this.adminStatus = AdminStatus.OFFLINE;
        this.adminStatusUpdatedAt = null;
    }

    public void updateAdministratorStatus(AdminStatus status) {
        if (role != UserRole.ADMIN) throw new IllegalArgumentException("관리자 계정만 운영 상태를 변경할 수 있습니다.");
        this.adminStatus = status;
        this.adminStatusUpdatedAt = Instant.now();
    }

    public void changeRole(UserRole role) {
        if (role == UserRole.ADMIN) throw new IllegalArgumentException("관리자 역할은 이 경로에서 변경할 수 없습니다.");
        this.role = role;
        this.adminLevel = AdminLevel.NONE;
        this.adminStatus = AdminStatus.OFFLINE;
        this.adminStatusUpdatedAt = null;
    }
}
