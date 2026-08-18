package com.chulsooya.server.domain.address;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeliveryAddressRepository extends JpaRepository<DeliveryAddress, Long> {
    List<DeliveryAddress> findByConsumerIdOrderByDefaultAddressDescUpdatedAtDesc(Long consumerId);

    Optional<DeliveryAddress> findFirstByConsumerIdAndIdNotOrderByUpdatedAtDesc(Long consumerId, Long id);

    long countByConsumerId(Long consumerId);

    @Modifying
    @Query("update DeliveryAddress address set address.defaultAddress = false where address.consumerId = :consumerId")
    void clearDefaultByConsumerId(@Param("consumerId") Long consumerId);

    @Modifying
    @Query("update DeliveryAddress address set address.defaultAddress = false where address.consumerId = :consumerId and address.id <> :addressId")
    void clearDefaultExcept(@Param("consumerId") Long consumerId, @Param("addressId") Long addressId);
}
