package com.chulsooya.server.domain.store;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public final class StoreDirectoryDtos {
    private StoreDirectoryDtos() {}

    public record StoreResponse(Long id, String name, String cityName, String districtName, String address,
            String phone, String imageUrl, List<String> handledItems, double rating, boolean verified,
            boolean receivingOrders, boolean restricted, int availableSlots, String tier, String ownerEmail) {
        public static StoreResponse from(Store store, Instant now) {
            List<String> items = Arrays.stream(store.getHandledItems().split(","))
                    .map(String::trim).filter(value -> !value.isBlank()).toList();
            return new StoreResponse(store.getId(), store.getName(), store.getCityName(), store.getDistrictName(),
                    store.getAddress(), store.getPhone(), store.getImageUrl(), items, store.getRating(),
                    store.isVerified(), store.isReceivingOrders(), store.isRestricted(now), store.getAvailableSlots(),
                    store.getTier().name(), store.getOwner().getEmail());
        }
    }

    public record RegionOption(String cityName, String districtName) {}

    public record CreateStoreRequest(
            @NotBlank String name, @NotBlank @Email String ownerEmail, @NotBlank String ownerName,
            @NotBlank String phone, @NotBlank String cityName, @NotBlank String districtName,
            @NotBlank String address, @Pattern(regexp = "^$|https?://.+", message = "이미지 주소는 http 또는 https URL이어야 합니다.") String imageUrl,
            String handledItems, @DecimalMin("0.0") @DecimalMax("5.0") double rating,
            boolean verified, boolean receivingOrders) {}

    public record UpdateStoreRequest(
            @NotBlank String name, @NotBlank String phone, @NotBlank String cityName, @NotBlank String districtName,
            @NotBlank String address, @Pattern(regexp = "^$|https?://.+", message = "이미지 주소는 http 또는 https URL이어야 합니다.") String imageUrl,
            String handledItems, @DecimalMin("0.0") @DecimalMax("5.0") double rating,
            boolean verified, boolean receivingOrders) {}
}
