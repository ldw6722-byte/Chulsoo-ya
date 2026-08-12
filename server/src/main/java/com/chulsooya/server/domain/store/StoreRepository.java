package com.chulsooya.server.domain.store;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface StoreRepository extends JpaRepository<Store, Long> {

	Optional<Store> findByOwnerId(Long ownerId);

	/** 매칭 자격: 동일 gu_code + 검증 완료. 슬롯 판정은 엔티티에서 수행. */
	@Query("select s from Store s where s.guCode = :guCode and s.verified = true")
	List<Store> findEligible(@Param("guCode") String guCode);

	/** 슬롯 회계 갱신 시 행 잠금. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select s from Store s where s.id = :id")
	Optional<Store> findByIdForUpdate(@Param("id") Long id);
}
