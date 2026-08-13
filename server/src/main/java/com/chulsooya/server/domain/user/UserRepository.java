package com.chulsooya.server.domain.user;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmail(String email);

	Optional<User> findBySupabaseUserId(UUID supabaseUserId);

	List<User> findByRole(UserRole role);
}
