package com.chulsooya.server.domain.store;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminStoreReviewNoteRepository extends JpaRepository<AdminStoreReviewNote, Long> {
    List<AdminStoreReviewNote> findByStoreIdOrderByCreatedAtDesc(Long storeId);
}
