package com.chulsooya.server.domain.store;

import static com.chulsooya.server.domain.store.StoreDirectoryDtos.*;

import java.time.Instant;
import java.time.LocalTime;
import java.util.Comparator;

import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.user.FeaturePermission;
import com.chulsooya.server.domain.user.FeaturePermissionService;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;

import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class StoreDirectoryService {
    private final StoreRepository stores;
    private final UserRepository users;
    private final FeaturePermissionService featurePermissions;

    public StoreDirectoryService(StoreRepository stores, UserRepository users, FeaturePermissionService featurePermissions) {
        this.stores = stores;
        this.users = users;
        this.featurePermissions = featurePermissions;
    }

    public List<StoreResponse> find(String cityName, String districtName) {
        String city = cityName == null || cityName.isBlank() ? "서울특별시" : cityName.trim();
        Instant now = Instant.now();
        List<Store> result = districtName == null || districtName.isBlank()
                ? stores.findByCityNameAndVerifiedTrueAndDirectoryVisibleTrueOrderByRatingDescNameAsc(city)
                : stores.findByCityNameAndDistrictNameAndVerifiedTrueAndDirectoryVisibleTrueOrderByRatingDescNameAsc(city, districtName.trim());
        return responses(result, now, false);
    }

    public List<RegionOption> regions() {
        return stores.findAll().stream()
                .filter(store -> store.isVerified() && store.isDirectoryVisible())
                .map(store -> new RegionOption(store.getCityName(), store.getDistrictName()))
                .distinct()
                .sorted(Comparator.comparing(RegionOption::cityName).thenComparing(RegionOption::districtName))
                .toList();
    }

    public List<StoreResponse> adminList(CurrentUser actor) {
                featurePermissions.require(actor, FeaturePermission.ADMIN_MANAGE_STORES);
        Instant now = Instant.now();

        List<Store> result = stores.findAll().stream().sorted(Comparator.comparing(Store::getCityName)
                .thenComparing(Store::getDistrictName).thenComparing(Store::getName)).toList();
        return responses(result, now, true);
    }

    @Transactional
    public StoreResponse create(CurrentUser actor, CreateStoreRequest request) {
                featurePermissions.require(actor, FeaturePermission.ADMIN_MANAGE_STORES);
        String email = request.ownerEmail().trim().toLowerCase(Locale.ROOT);

        User owner = users.findByEmail(email)
                .orElseGet(() -> users.save(new User(email, request.ownerName().trim(), request.phone().trim(), UserRole.SELLER)));
        if (owner.getRole() != UserRole.SELLER || stores.findByOwnerId(owner.getId()).isPresent()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "이미 등록된 판매자 이메일입니다.");
        }
        Store store = new Store(owner, request.name().trim(), guCode(request.districtName()), request.address().trim(), request.phone().trim(), SubscriptionTier.SILVER);
        store.changeDirectoryProfile(request.name(), request.cityName(), request.districtName(), guCode(request.districtName()), request.address(), request.phone(), request.imageUrl(), request.handledItems());
        // 후기 기반 별점은 StoreReviewService가 공개 후기 평균으로만 갱신한다.
        store.changeOperatingStatus(request.verified(), request.receivingOrders());
                store.changeCustomerDisplaySettings(request.customerBadgeText(), request.customerNoticeText(), request.directoryVisible());
        changeOperations(store, request.directions(), request.businessOpenTime(), request.businessCloseTime(),
                request.weeklyClosedDays(), request.temporaryClosed());
        return response(stores.save(store), Instant.now(), true);

    }

    @Transactional
    public StoreResponse update(CurrentUser actor, Long storeId, UpdateStoreRequest request) {
                featurePermissions.require(actor, FeaturePermission.ADMIN_MANAGE_STORES);
        Store store = requireStore(storeId);

        store.changeDirectoryProfile(request.name(), request.cityName(), request.districtName(), guCode(request.districtName()), request.address(), request.phone(), request.imageUrl(), request.handledItems());
        // 후기 기반 별점은 StoreReviewService가 공개 후기 평균으로만 갱신한다.
        store.changeOperatingStatus(request.verified(), request.receivingOrders());
                store.changeCustomerDisplaySettings(request.customerBadgeText(), request.customerNoticeText(), request.directoryVisible());
        changeOperations(store, request.directions(), request.businessOpenTime(), request.businessCloseTime(),
                request.weeklyClosedDays(), request.temporaryClosed());
        return response(store, Instant.now(), true);

    }

    @Transactional
    public void delete(CurrentUser actor, Long storeId) {
                featurePermissions.require(actor, FeaturePermission.ADMIN_MANAGE_STORES);
        stores.delete(requireStore(storeId));

    }

    private List<StoreResponse> responses(List<Store> stores, Instant now, boolean includeOwnerEmail) {
        return stores.stream().map(store -> response(store, now, includeOwnerEmail)).toList();
    }

    private StoreResponse response(Store store, Instant now, boolean includeOwnerEmail) {
        // ponytail: 후기 생성·수정·숨김 시 StoreReviewService가 Store.rating을 갱신하고, 고객 목록은 판매자 이메일이 필요 없다.
        return includeOwnerEmail ? StoreResponse.from(store, now) : StoreResponse.fromPublic(store, now);
    }

    private Store requireStore(Long id) {
        return stores.findById(id).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매점을 찾을 수 없습니다."));
    }

        private void changeOperations(Store store, String directions, LocalTime openTime, LocalTime closeTime,
            java.util.Set<java.time.DayOfWeek> closedDays, boolean temporaryClosed) {
        store.changeBusinessOperations(directions, openTime == null ? store.getBusinessOpenTime() : openTime,
                closeTime == null ? store.getBusinessCloseTime() : closeTime,
                closedDays == null ? store.weeklyClosedDaySet() : closedDays, temporaryClosed);
    }

    private String guCode(String districtName) {

        return "GU_" + Integer.toHexString(districtName.trim().hashCode() & 0xFFFF).toUpperCase();
    }
}
