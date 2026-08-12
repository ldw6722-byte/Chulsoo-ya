package com.chulsooya.server.common;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

	// 공통
	VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),
	NOT_FOUND(HttpStatus.NOT_FOUND, "대상을 찾을 수 없습니다."),
	FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다."),
	INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

	// 장바구니
	CART_EMPTY(HttpStatus.BAD_REQUEST, "장바구니가 비어 있습니다."),
	INVALID_QUANTITY(HttpStatus.BAD_REQUEST, "수량은 1 이상이어야 합니다."),
	PRODUCT_INACTIVE(HttpStatus.BAD_REQUEST, "판매 중지된 상품입니다."),

	// 주문 · 매칭
	ADDRESS_REQUIRED(HttpStatus.BAD_REQUEST, "배달 주소를 먼저 설정해 주세요."),
	GU_CODE_UNRESOLVED(HttpStatus.BAD_REQUEST, "주소에서 지역 코드를 확인할 수 없습니다."),
	ORDER_NOT_WAITING_MATCH(HttpStatus.CONFLICT, "이미 마감된 주문입니다."),
	OFFER_EXPIRED(HttpStatus.CONFLICT, "주문 제안이 만료되었습니다."),
	OFFER_ALREADY_CLOSED(HttpStatus.CONFLICT, "이미 처리된 주문 제안입니다."),
	ALREADY_HAS_WINNER(HttpStatus.CONFLICT, "이미 다른 판매자에게 낙찰된 주문입니다."),
	INVALID_ORDER_STATUS(HttpStatus.CONFLICT, "현재 주문 상태에서는 수행할 수 없습니다."),
	CONFIRMATION_DEADLINE_PASSED(HttpStatus.CONFLICT, "물품 확인 시간이 만료되었습니다."),

	// 판매자 슬롯
	SLOT_CAP_EXCEEDED(HttpStatus.BAD_REQUEST, "구독 등급의 최대 슬롯 수를 초과했습니다."),
	SLOT_FULL(HttpStatus.CONFLICT, "가용 슬롯이 없습니다."),
	STORE_RESTRICTED(HttpStatus.FORBIDDEN, "패널티로 응찰이 제한된 상태입니다."),
	STORE_NOT_RECEIVING(HttpStatus.CONFLICT, "주문 수신이 중지된 상태입니다."),

	// 결제
	PAYMENT_NOT_ALLOWED_YET(HttpStatus.CONFLICT, "판매자 물품 확인 완료 후 결제할 수 있습니다."),
	DUPLICATE_IDEMPOTENCY_KEY(HttpStatus.CONFLICT, "이미 처리된 요청입니다.");

	private final HttpStatus status;
	private final String message;

	ErrorCode(HttpStatus status, String message) {
		this.status = status;
		this.message = message;
	}

	public HttpStatus getStatus() {
		return status;
	}

	public String getMessage() {
		return message;
	}
}
