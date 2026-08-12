package com.chulsooya.server.domain.store;

import static com.chulsooya.server.domain.store.StoreDirectoryDtos.*;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRepository;
import com.chulsooya.server.domain.user.UserRole;
import com.chulsooya.server.support.CurrentUser;

@Service
@Transactional(readOnly = true)
public class StoreDirectoryService {
    private final StoreRepository stores;
    private final UserRepository users;

    public StoreDirectoryService(StoreRepository stores, UserRepository users) {
        this.stores = stores;
        this.users = users;
    }

    public List<StoreResponse> find(String cityName, String districtName) {
        String city = cityName == null || cityName.isBlank() ? "서울특별시" : cityName.trim();
        Instant now = Instant.now();
        List<Store> result = districtName == null || districtName.isBlank()
                ? stores.findByCityNameAndVerifiedTrueOrderByRatingDescNameAsc(city)
                : stores.findByCityNameAndDistrictNameAndVerifiedTrueOrderByRatingDescNameAsc(city, districtName.trim());
        return result.stream().map(store -> StoreResponse.from(store, now)).toList();
    }

    public List<RegionOption> regions() {
        return stores.findAll().stream()
                .map(store -> new RegionOption(store.getCityName(), store.getDistrictName()))
                .distinct()
                .sorted(Comparator.comparing(RegionOption::cityName).thenComparing(RegionOption::districtName))
                .toList();
    }

    public List<StoreResponse> adminList(CurrentUser actor) {
        requireAdmin(actor);
        Instant now = Instant.now();
        return stores.findAll().stream().sorted(Comparator.comparing(Store::getCityName)
                .thenComparing(Store::getDistrictName).thenComparing(Store::getName))
                .map(store -> StoreResponse.from(store, now)).toList();
    }

    @Transactional
    public StoreResponse create(CurrentUser actor, CreateStoreRequest request) {
        requireAdmin(actor);
        String email = request.ownerEmail().trim().toLowerCase(Locale.ROOT);
        User owner = users.findByEmail(email)
                .orElseGet(() -> users.save(new User(email, request.ownerName().trim(), request.phone().trim(), UserRole.SELLER)));
        if (owner.getRole() != UserRole.SELLER || stores.findByOwnerId(owner.getId()).isPresent()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "이미 등록된 판매자 이메일입니다.");
        }
        Store store = new Store(owner, request.name().trim(), guCode(request.districtName()), request.address().trim(), request.phone().trim(), SubscriptionTier.FREE);
        store.changeDirectoryProfile(request.name(), request.cityName(), request.districtName(), guCode(request.districtName()), request.address(), request.phone(), request.imageUrl(), request.handledItems());
        store.changeRating(request.rating());
        store.changeOperatingStatus(request.verified(), request.receivingOrders());
        return StoreResponse.from(stores.save(store), Instant.now());
    }

    @Transactional
    public StoreResponse update(CurrentUser actor, Long storeId, UpdateStoreRequest request) {
        requireAdmin(actor);
        Store store = requireStore(storeId);
        store.changeDirectoryProfile(request.name(), request.cityName(), request.districtName(), guCode(request.districtName()), request.address(), request.phone(), request.imageUrl(), request.handledItems());
        store.changeRating(request.rating());
        store.changeOperatingStatus(request.verified(), request.receivingOrders());
        return StoreResponse.from(store, Instant.now());
    }

    @Transactional
    public void delete(CurrentUser actor, Long storeId) {
        requireAdmin(actor);
        stores.delete(requireStore(storeId));
    }

    private Store requireStore(Long id) {
        return stores.findById(id).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "판매점을 찾을 수 없습니다."));
    }

    private void requireAdmin(CurrentUser actor) {
        if (!actor.isAdmin()) throw new DomainException(ErrorCode.FORBIDDEN, "관리자 권한이 필요합니다.");
    }

    private String guCode(String districtName) {
        return "GU_" + Integer.toHexString(districtName.trim().hashCode() & 0xFFFF).toUpperCase();
    }
}
