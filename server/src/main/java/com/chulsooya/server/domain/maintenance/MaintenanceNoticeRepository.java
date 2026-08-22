package com.chulsooya.server.domain.maintenance;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MaintenanceNoticeRepository extends JpaRepository<MaintenanceNotice, Long> {

    List<MaintenanceNotice> findAllByOrderByUpdatedAtDesc();
}
