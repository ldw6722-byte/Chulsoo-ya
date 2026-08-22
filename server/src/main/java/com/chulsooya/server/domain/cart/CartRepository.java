package com.chulsooya.server.domain.cart;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CartRepository extends JpaRepository<Cart, Long> {

	Optional<Cart> findByConsumerIdAndActiveTrue(Long consumerId);

	@Query("select count(item) > 0 from Cart cart join cart.items item where item.productId = :productId")
	boolean existsItemByProductId(@Param("productId") Long productId);
}
