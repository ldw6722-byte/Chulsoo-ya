package com.chulsooya.server.domain.region;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 판매점 등록·매칭·탐색의 전국 시군구 마스터.
 * 법정동 코드의 시군구 수준 5자리 코드를 단일 식별자로 사용한다.
 */
@Entity
@Getter
@Table(name = "service_regions")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ServiceRegion {
    @Id
    @Column(length = 5)
    private String code;

    @Column(name = "city_name", nullable = false, length = 60)
    private String cityName;

    @Column(name = "district_name", nullable = false, length = 80)
    private String districtName;

    @Column(name = "display_name", nullable = false, length = 160)
    private String displayName;

    @Column(nullable = false)
    private boolean active;
}
