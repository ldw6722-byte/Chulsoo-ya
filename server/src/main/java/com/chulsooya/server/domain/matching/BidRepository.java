package com.chulsooya.server.domain.matching;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BidRepository extends JpaRepository<Bid, Long> {

	Optional<Bid> findByOrderIdAndWinnerTrue(Long orderId);

	List<Bid> findByOrderId(Long orderId);

	long countByStoreId(Long storeId);

	long countByStoreIdAndWinnerTrue(Long storeId);
}
