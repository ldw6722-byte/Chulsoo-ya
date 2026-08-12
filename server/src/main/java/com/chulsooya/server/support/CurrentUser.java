package com.chulsooya.server.support;

import com.chulsooya.server.domain.user.UserRole;

/**
 * 요청 주체.
 * ponytail: 개발 단계에서는 X-User-Id / X-User-Role 헤더로 주입한다.
 * upgrade path: Supabase JWT 클레임에서 추출하는 ArgumentResolver 로 교체.
 */
public record CurrentUser(Long userId, UserRole role) {

	public boolean isSeller() {
		return role == UserRole.SELLER;
	}

	public boolean isAdmin() {
		return role == UserRole.ADMIN;
	}
}
