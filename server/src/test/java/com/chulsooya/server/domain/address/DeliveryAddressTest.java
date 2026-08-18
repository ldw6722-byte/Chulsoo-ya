package com.chulsooya.server.domain.address;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class DeliveryAddressTest {
    @Test
    @DisplayName("배송지는 서울시 구와 상세 주소를 보존하고 기본 배송지로 생성된다")
    void createsDefaultAddress() {
        DeliveryAddress address = new DeliveryAddress(101L, "기본 주소지", "홍길동", "010-1234-5678",
                "서울특별시", "강남구", "테헤란로 123", "101호", true);

        assertThat(address.isDefaultAddress()).isTrue();
        assertThat(address.getFullAddress()).isEqualTo("서울특별시 강남구 테헤란로 123");
        assertThat(address.getAddressDetail()).isEqualTo("101호");
    }

    @Test
    @DisplayName("배송지 정보는 수정할 수 있고 기본 지정은 명시적으로 해제할 수 있다")
    void updatesAndChangesDefaultStatus() {
        DeliveryAddress address = new DeliveryAddress(101L, "현장", "홍길동", "010-1234-5678",
                "서울특별시", "마포구", "양화로 45", null, true);

        address.update("내일 현장", "김철수", "010-9876-5432", "서울특별시", "서초구", "반포대로 30", "2층");
        address.clearDefault();

        assertThat(address.isDefaultAddress()).isFalse();
        assertThat(address.getLabel()).isEqualTo("내일 현장");
        assertThat(address.getDistrictName()).isEqualTo("서초구");
        assertThat(address.getFullAddress()).isEqualTo("서울특별시 서초구 반포대로 30");
        assertThat(address.getAddressDetail()).isEqualTo("2층");
    }
}
