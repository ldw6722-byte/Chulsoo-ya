package com.chulsooya.server.domain.user;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserFeaturePermissionRepository extends JpaRepository<UserFeaturePermission, Long> {
    Optional<UserFeaturePermission> findByUserIdAndPermissionCode(Long userId, FeaturePermission permissionCode);
    List<UserFeaturePermission> findByUserIdOrderByPermissionCodeAsc(Long userId);
    boolean existsByUserIdAndPermissionCodeAndEnabledTrue(Long userId, FeaturePermission permissionCode);
    List<UserFeaturePermission> findByUserIdInAndPermissionCodeIn(Collection<Long> userIds, Collection<FeaturePermission> permissionCodes);
}
