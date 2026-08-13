package com.chulsooya.server.domain.support;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerNotificationRepository extends JpaRepository<CustomerNotification, Long> {
    List<CustomerNotification> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);
}
