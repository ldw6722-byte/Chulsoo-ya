package com.chulsooya.server.domain.support;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerNoticeRepository extends JpaRepository<CustomerNotice, Long> {
    List<CustomerNotice> findAllByOrderByUpdatedAtDesc();
}
