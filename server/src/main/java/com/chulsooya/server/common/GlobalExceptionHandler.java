package com.chulsooya.server.common;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** AGENTS.md 4.2: 실패는 항상 { "error": { "code", "message" } } 형태. */
@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(DomainException.class)
	public ResponseEntity<Map<String, Object>> handleDomain(DomainException e) {
		return build(e.getErrorCode().name(), e.getMessage(), e.getStatus().value());
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException e) {
		String message = e.getReason() == null || e.getReason().isBlank() ? "요청을 처리할 수 없습니다." : e.getReason();
		return build(e.getStatusCode().is4xxClientError() ? "FORBIDDEN" : "REQUEST_FAILED", message, e.getStatusCode().value());
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
		log.error("Unhandled server exception: {}", e.getClass().getSimpleName(), e);
		return build(ErrorCode.INTERNAL_ERROR.name(), ErrorCode.INTERNAL_ERROR.getMessage(),
				ErrorCode.INTERNAL_ERROR.getStatus().value());
	}

	private ResponseEntity<Map<String, Object>> build(String code, String message, int status) {
		return ResponseEntity.status(status)
				.body(Map.of("error", Map.of("code", code, "message", message)));
	}
}
