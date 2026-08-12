package com.chulsooya.server.common;

/** 성공 응답 래퍼. AGENTS.md 4.2: 성공은 항상 { "data": ... } 형태. */
public record ApiResponse<T>(T data) {

	public static <T> ApiResponse<T> of(T data) {
		return new ApiResponse<>(data);
	}
}
