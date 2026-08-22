package com.chulsooya.server.domain.order;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.order.OrderDtos.CreateOrderRequest;
import com.chulsooya.server.domain.order.OrderDtos.OrderResponse;
import com.chulsooya.server.domain.order.OrderDtos.OrderSummaryResponse;
import com.chulsooya.server.support.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

	private final OrderService orderService;
	private final PaymentRefundService paymentRefundService;
	private final TradeDocumentService tradeDocuments;

	public OrderController(OrderService orderService, PaymentRefundService paymentRefundService, TradeDocumentService tradeDocuments) {
		this.orderService = orderService;
		this.paymentRefundService = paymentRefundService;
		this.tradeDocuments = tradeDocuments;
	}

	/** 장바구니 -> 매칭 요청 (WAITING_MATCH 생성 + 제안 발송) */
	@PostMapping
	public ApiResponse<OrderResponse> create(CurrentUser user, @Valid @RequestBody CreateOrderRequest request) {
		return ApiResponse.of(orderService.requestMatching(user.userId(), request));
	}

	@GetMapping
	public ApiResponse<List<OrderSummaryResponse>> list(CurrentUser user) {
		return ApiResponse.of(orderService.listByConsumer(user.userId()));
	}

	/** 매칭 대기·판매자 확인 대기 화면이 폴링하는 엔드포인트. serverTime 을 함께 반환한다. */
	@GetMapping("/{orderId}")
	public ApiResponse<OrderResponse> get(CurrentUser user, @PathVariable Long orderId) {
		return ApiResponse.of(orderService.get(orderId, user.userId(), user.isAdmin()));
	}

		@GetMapping("/{orderId}/payment")
	public ApiResponse<PaymentRefundView> payment(CurrentUser user, @PathVariable Long orderId) {
		return ApiResponse.of(paymentRefundService.paymentView(orderId, user.userId(), user.isAdmin()));
	}

	/** 파일을 저장하지 않고 주문 DB 스냅샷으로 즉시 생성하는 구매자 거래 서류. */
	@GetMapping(value = "/{orderId}/documents/{type}", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> document(CurrentUser user, @PathVariable Long orderId, @PathVariable TradeDocumentType type) {
		TradeDocumentService.TradeDocumentFile file = tradeDocuments.renderForConsumer(orderId, user.userId(), user.isAdmin(), type);
		return pdf(file);
	}

	public static ResponseEntity<byte[]> pdf(TradeDocumentService.TradeDocumentFile file) {
		return ResponseEntity.ok()
				.cacheControl(CacheControl.noStore().cachePrivate())
				.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(file.fileName(), StandardCharsets.UTF_8).build().toString())
				.contentType(MediaType.APPLICATION_PDF)
				.contentLength(file.bytes().length)
				.body(file.bytes());
	}



	@PostMapping("/{orderId}/cancel")
	public ApiResponse<OrderResponse> cancel(CurrentUser user, @PathVariable Long orderId,
			@RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
		return ApiResponse.of(orderService.cancel(orderId, user.userId(), idempotencyKey));
	}
}
