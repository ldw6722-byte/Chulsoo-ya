package com.chulsooya.server.domain.matching;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MatchOfferRepository extends JpaRepository<MatchOffer, Long> {

	Optional<MatchOffer> findByOrderIdAndStoreIdAndAttempt(Long orderId, Long storeId, int attempt);

	List<MatchOffer> findByOrderIdAndAttempt(Long orderId, int attempt);

	@Query("""
			select o from MatchOffer o
			where o.storeId = :storeId
			  and o.status = com.chulsooya.server.domain.matching.OfferStatus.SENT
			  and o.expiresAt > :now
			order by o.offeredAt asc
			""")
	List<MatchOffer> findOpenByStore(@Param("storeId") Long storeId, @Param("now") Instant now);

	@Query("""
			select o from MatchOffer o
			where o.status = com.chulsooya.server.domain.matching.OfferStatus.SENT
			  and o.expiresAt <= :now
			""")
	List<MatchOffer> findExpired(@Param("now") Instant now);

	@Query("""
			select o from MatchOffer o
			where o.orderId = :orderId
			  and o.status = com.chulsooya.server.domain.matching.OfferStatus.SENT
			""")
	List<MatchOffer> findOpenByOrder(@Param("orderId") Long orderId);
}
