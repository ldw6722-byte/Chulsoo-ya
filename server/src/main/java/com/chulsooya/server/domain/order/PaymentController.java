package com.chulsooya.server.domain.order;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.order.OrderDtos.OrderResponse;
import com.chulsooya.server.support.CurrentUser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

	public record ConfirmPaymentRequest(
			Long orderId,
			@NotBlank String idempotencyKey,
			String method) {
	}

	private final OrderRepository orderRepository;
	private final PaymentRepository paymentRepository;
	private final OrderService orderService;
	private final Clock clock;

	public PaymentController(OrderRepository orderRepository,
			PaymentRepository paymentRepository,
			OrderService orderService,
			Clock clock) {
		this.orderRepository = orderRepository;
		this.paymentRepository = paymentRepository;
		this.orderService = orderService;
		this.clock = clock;
	}

	/**
	 * 결제 승인.
	 * ponytail: PG 승인 호출을 생략한 스텁이며 상태 순서와 멱등성만 강제한다.
	 * upgrade path: 토스페이먼츠 승인 API 호출 + 웹훅 서명 검증으로 교체.
	 */
	@PostMapping("/confirm")
	@Transactional
	public ApiResponse<OrderResponse> confirm(CurrentUser user, @Valid @RequestBody ConfirmPaymentRequest request) {
		Instant now = clock.instant();

		Order order = orderRepository.findByIdForUpdate(request.orderId())
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "주문을 찾을 수 없습니다."));
		if (!order.getConsumerId().equals(user.userId())) {
			throw new DomainException(ErrorCode.FORBIDDEN);
		}
		// 멱등성: 동일 주문의 재요청만 기존 결과를 반환한다. 다른 주문의 키 재사용은 거부한다.
		Payment existing = paymentRepository.findByIdempotencyKey(request.idempotencyKey()).orElse(null);
		if (existing != null) {
			if (!existing.getOrderId().equals(order.getId())) {
				throw new DomainException(ErrorCode.DUPLICATE_IDEMPOTENCY_KEY);
			}
			return ApiResponse.of(orderService.toResponse(order));
		}
		if (order.getStatus() != OrderStatus.PAYMENT_PENDING) {
			throw new DomainException(ErrorCode.PAYMENT_NOT_ALLOWED_YET);
		}

		Payment payment = paymentRepository.save(new Payment(
				order.getId(), request.idempotencyKey(), order.getTotalAmount(),
				request.method() == null ? "CARD" : request.method()));
		payment.markPaid("stub_" + UUID.randomUUID(), now);

		order.markPaid(now);
		order.transitionTo(OrderStatus.PREPARING, now);
		return ApiResponse.of(orderService.toResponse(order));
	}
}
