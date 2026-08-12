package com.chulsooya.server.config;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class AppConfig {

	/** 모든 마감 판정은 이 Clock 만 사용한다. 테스트에서 고정 Clock 으로 대체 가능. */
	@Bean
	public Clock clock(AppProperties properties) {
		return Clock.system(ZoneId.of(properties.timezone()));
	}
}
