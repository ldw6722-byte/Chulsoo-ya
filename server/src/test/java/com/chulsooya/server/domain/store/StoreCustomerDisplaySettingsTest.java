package com.chulsooya.server.domain.store;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.chulsooya.server.domain.user.User;
import com.chulsooya.server.domain.user.UserRole;

class StoreCustomerDisplaySettingsTest {
    private Store store;

    @BeforeEach
    void setUp() {
        User owner = new User("seller@example.dev", "판매자", "010-0000-0000", UserRole.SELLER);
        store = new Store(owner, "철수철물", "GU_TEST", "서울특별시 강남구 1", "02-000-0000", SubscriptionTier.SILVER);
    }

    @Test
    @DisplayName("관리자는 고객 노출 배지·안내 문구·목록 노출 여부를 함께 저장할 수 있다")
    void changesCustomerDisplaySettings() {
        store.changeCustomerDisplaySettings("당일 배달 가능", "주문 전 취급 품목을 확인해 주세요.", false);

        assertThat(store.getCustomerBadgeText()).isEqualTo("당일 배달 가능");
        assertThat(store.getCustomerNoticeText()).isEqualTo("주문 전 취급 품목을 확인해 주세요.");
        assertThat(store.isDirectoryVisible()).isFalse();
    }

    @Test
    @DisplayName("비어 있는 고객 노출 문구는 저장하지 않는다")
    void clearsBlankCustomerDisplayText() {
        store.changeCustomerDisplaySettings("  ", " ", true);

        assertThat(store.getCustomerBadgeText()).isNull();
        assertThat(store.getCustomerNoticeText()).isNull();
        assertThat(store.isDirectoryVisible()).isTrue();
    }
}
