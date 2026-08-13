package com.chulsooya.server.support;

import com.chulsooya.server.domain.user.UserRole;

/**
 * 요청 주체.
 * ponytail: 개발 단계에는 X-User-Id로 시드 사용자를 찾고, 역할은 DB 사용자 레코드에서 읽는다.
 * upgrade path: 운영에서는 Supabase JWT 검증 뒤 DB 역할을 사용한다.
 */
public record CurrentUser(Long userId, UserRole role) {

	public boolean isSeller() {
		return role == UserRole.SELLER;
	}

	public boolean isAdmin() {
		return role == UserRole.ADMIN;
	}
}
