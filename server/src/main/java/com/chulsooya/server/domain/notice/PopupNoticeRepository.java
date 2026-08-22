package com.chulsooya.server.domain.notice;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PopupNoticeRepository extends JpaRepository<PopupNotice, Long> {
    List<PopupNotice> findAllByOrderByUpdatedAtDesc();
}
