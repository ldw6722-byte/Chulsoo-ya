package com.chulsooya.server.common;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** AGENTS.md 4.2: 실패는 항상 { "error": { "code", "message" } } 형태. */
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(DomainException.class)
	public ResponseEntity<Map<String, Object>> handleDomain(DomainException e) {
		return build(e.getErrorCode().name(), e.getMessage(), e.getStatus().value());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e) {
		String detail = e.getBindingResult().getFieldErrors().stream()
				.findFirst()
				.map(f -> f.getField() + ": " + f.getDefaultMessage())
				.orElse(ErrorCode.VALIDATION_FAILED.getMessage());
		return build(ErrorCode.VALIDATION_FAILED.name(), detail,
				ErrorCode.VALIDATION_FAILED.getStatus().value());
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, Object>> handleUnknown(Exception e) {
		return build(ErrorCode.INTERNAL_ERROR.name(), ErrorCode.INTERNAL_ERROR.getMessage(),
				ErrorCode.INTERNAL_ERROR.getStatus().value());
	}

	private ResponseEntity<Map<String, Object>> build(String code, String message, int status) {
		return ResponseEntity.status(status)
				.body(Map.of("error", Map.of("code", code, "message", message)));
	}
}
