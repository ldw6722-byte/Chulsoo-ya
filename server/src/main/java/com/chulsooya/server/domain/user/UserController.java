package com.chulsooya.server.domain.user;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;

/**
 * 개발용 계정 목록.
 * ponytail: 로그인 없이 역할을 전환해 검증하기 위한 조회 API.
 * upgrade path: Supabase Auth 세션 기반 /api/me 로 교체하고 이 엔드포인트는 제거.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

	public record UserResponse(Long id, String email, String name, UserRole role) {
		static UserResponse from(User u) {
			return new UserResponse(u.getId(), u.getEmail(), u.getName(), u.getRole());
		}
	}

	private final UserRepository userRepository;

	public UserController(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@GetMapping
	public ApiResponse<List<UserResponse>> list() {
		return ApiResponse.of(userRepository.findAll().stream().map(UserResponse::from).toList());
	}
}
