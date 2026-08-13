package com.chulsooya.server.domain.order;

import java.util.List;

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

	public OrderController(OrderService orderService, PaymentRefundService paymentRefundService) {
		this.orderService = orderService;
		this.paymentRefundService = paymentRefundService;
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

	@PostMapping("/{orderId}/cancel")
	public ApiResponse<OrderResponse> cancel(CurrentUser user, @PathVariable Long orderId,
			@RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
		return ApiResponse.of(orderService.cancel(orderId, user.userId(), idempotencyKey));
	}
}
