package com.chulsooya.server.domain.support;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportInquiryRepository extends JpaRepository<SupportInquiry, Long> {
    List<SupportInquiry> findByConsumerIdOrderByCreatedAtDesc(Long consumerId);
    List<SupportInquiry> findAllByOrderByCreatedAtDesc();
    List<SupportInquiry> findByStatusOrderByCreatedAtDesc(SupportInquiryStatus status);
}
