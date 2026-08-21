package com.chulsooya.server.domain.store;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class StoreDirectoryDtos {
    private StoreDirectoryDtos() {}

    public record StoreResponse(Long id, String name, String cityName, String districtName, String address,
            String phone, String imageUrl, List<String> handledItems, double rating, boolean verified,
            boolean receivingOrders, boolean directoryVisible, String customerBadgeText, String customerNoticeText,
            String directions, LocalTime businessOpenTime, LocalTime businessCloseTime, Set<DayOfWeek> weeklyClosedDays,
            boolean temporaryClosed, StoreOperatingStatus operatingStatus, boolean restricted, int availableSlots,
            String tier, String ownerEmail) {
        public static StoreResponse from(Store store, Instant now) {
            return from(store, now, store.getOwner().getEmail());
        }

        public static StoreResponse fromPublic(Store store, Instant now) {
            return from(store, now, null);
        }

        private static StoreResponse from(Store store, Instant now, String ownerEmail) {
            List<String> items = Arrays.stream(store.getHandledItems().split(","))
                    .map(String::trim).filter(value -> !value.isBlank()).toList();
            return new StoreResponse(store.getId(), store.getName(), store.getCityName(), store.getDistrictName(),
                    store.getAddress(), store.getPhone(), store.getImageUrl(), items, store.getRating(),
                    store.isVerified(), store.isReceivingOrders(), store.isDirectoryVisible(), store.getCustomerBadgeText(),
                    store.getCustomerNoticeText(), store.getDirections(), store.getBusinessOpenTime(),
                    store.getBusinessCloseTime(), store.weeklyClosedDaySet(), store.isTemporaryClosed(),
                    store.operatingStatus(now), store.isRestricted(now), store.getAvailableSlots(),
                    store.getTier().name(), ownerEmail);
        }
    }

    public record RegionOption(String cityName, String districtName) {}

    public record CreateStoreRequest(
            @NotBlank String name, @NotBlank @Email String ownerEmail, @NotBlank String ownerName,
            @NotBlank String phone, @NotBlank String cityName, @NotBlank String districtName,
            @NotBlank String address, @Pattern(regexp = "^$|https?://.+", message = "이미지 주소는 http 또는 https URL이어야 합니다.") String imageUrl,
            String handledItems, @Size(max = 60) String customerBadgeText, @Size(max = 200) String customerNoticeText,
            @Size(max = 500) String directions, LocalTime businessOpenTime, LocalTime businessCloseTime,
            Set<DayOfWeek> weeklyClosedDays, boolean temporaryClosed,
            @DecimalMin("0.0") @DecimalMax("5.0") double rating,
            boolean verified, boolean receivingOrders, boolean directoryVisible) {}

    public record UpdateStoreRequest(
            @NotBlank String name, @NotBlank String phone, @NotBlank String cityName, @NotBlank String districtName,
            @NotBlank String address, @Pattern(regexp = "^$|https?://.+", message = "이미지 주소는 http 또는 https URL이어야 합니다.") String imageUrl,
            String handledItems, @Size(max = 60) String customerBadgeText, @Size(max = 200) String customerNoticeText,
            @Size(max = 500) String directions, LocalTime businessOpenTime, LocalTime businessCloseTime,
            Set<DayOfWeek> weeklyClosedDays, boolean temporaryClosed,
            @DecimalMin("0.0") @DecimalMax("5.0") double rating,
            boolean verified, boolean receivingOrders, boolean directoryVisible) {}
}
