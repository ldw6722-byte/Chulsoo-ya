package com.chulsooya.server.common;

import org.springframework.http.HttpStatus;

/** 비즈니스 규칙 위반. 코드는 클라이언트가 분기 가능한 안정 문자열로 유지한다. */
public class DomainException extends RuntimeException {

	private final ErrorCode errorCode;

	public DomainException(ErrorCode errorCode) {
		super(errorCode.getMessage());
		this.errorCode = errorCode;
	}

	public DomainException(ErrorCode errorCode, String message) {
		super(message);
		this.errorCode = errorCode;
	}

	public ErrorCode getErrorCode() {
		return errorCode;
	}

	public HttpStatus getStatus() {
		return errorCode.getStatus();
	}
}
