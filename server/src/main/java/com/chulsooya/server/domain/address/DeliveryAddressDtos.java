package com.chulsooya.server.domain.address;

import java.time.Instant;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class DeliveryAddressDtos {
    private DeliveryAddressDtos() {
    }

    public record DeliveryAddressRequest(
            @NotBlank @Size(max = 30) String label,
            @NotBlank @Size(max = 40) String recipientName,
            @NotBlank @Size(max = 30) String recipientPhone,
            @NotBlank @Size(max = 30) String cityName,
            @NotBlank @Size(max = 30) String districtName,
            @NotBlank @Size(max = 180) String roadAddress,
            @Size(max = 180) String addressDetail,
            boolean defaultAddress) {
    }

    public record DeliveryAddressResponse(
            Long id,
            String label,
            String recipientName,
            String recipientPhone,
            String cityName,
            String districtName,
            String roadAddress,
            String addressDetail,
            String fullAddress,
            boolean defaultAddress,
            Instant createdAt,
            Instant updatedAt) {
        public static DeliveryAddressResponse from(DeliveryAddress address) {
            return new DeliveryAddressResponse(address.getId(), address.getLabel(), address.getRecipientName(),
                    address.getRecipientPhone(), address.getCityName(), address.getDistrictName(), address.getRoadAddress(),
                    address.getAddressDetail(), address.getFullAddress(), address.isDefaultAddress(), address.getCreatedAt(),
                    address.getUpdatedAt());
        }
    }
}
