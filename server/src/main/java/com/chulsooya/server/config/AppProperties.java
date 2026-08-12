package com.chulsooya.server.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** application.yaml 의 app.* 값. 마감 시간은 서버 설정만이 권위를 가진다. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(String timezone, Matching matching, Delivery delivery) {

	public record Matching(int matchWindowSeconds, int sellerConfirmWindowSeconds, int offerTtlSeconds) {
	}

	public record Delivery(int fee) {
	}
}
