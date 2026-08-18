package com.chulsooya.server.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** application.yaml의 app.* 값. 마감 시간과 개발 정산 수수료율은 서버 설정만이 권위를 가진다. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(String timezone, Matching matching, Delivery delivery, Settlement settlement) {
    public record Matching(int matchWindowSeconds, int sellerConfirmWindowSeconds, int offerTtlSeconds) {}
    public record Delivery(int fee) {}
    /** ponytail: 개발 기준 수수료율. 운영 전 판매자 약관·계약 수수료 정책으로 교체한다. */
    public record Settlement(int commissionBps) {}
}
