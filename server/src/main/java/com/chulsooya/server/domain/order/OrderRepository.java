package com.chulsooya.server.domain.order;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface OrderRepository extends JpaRepository<Order, Long> {

	List<Order> findByConsumerIdOrderByIdDesc(Long consumerId);

	List<Order> findByWinningStoreIdOrderByIdDesc(Long winningStoreId);

	/** 낙찰 트랜잭션 진입점. 주문 단위 비관적 락으로 단일 낙찰자를 보장한다. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select o from Order o where o.id = :id")
	Optional<Order> findByIdForUpdate(@Param("id") Long id);

	@Query("""
			select o from Order o
			where o.status = com.chulsooya.server.domain.order.OrderStatus.WAITING_MATCH
			  and o.matchDeadlineAt <= :now
			""")
	List<Order> findExpiredWaitingMatch(@Param("now") Instant now);

	@Query("""
			select o from Order o
			where o.status = com.chulsooya.server.domain.order.OrderStatus.SELLER_CONFIRMING
			  and o.sellerConfirmationDeadlineAt <= :now
			""")
	List<Order> findExpiredSellerConfirming(@Param("now") Instant now);

	@Query("""
			select o from Order o
			where o.status = com.chulsooya.server.domain.order.OrderStatus.WAITING_MATCH
			  and o.guCode = :guCode
			""")
	List<Order> findWaitingMatchByGuCode(@Param("guCode") String guCode);
}
