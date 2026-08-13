package com.chulsooya.server.domain.order;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.config.AppProperties;
import com.chulsooya.server.domain.cart.Cart;
import com.chulsooya.server.domain.coupon.CouponService;
import com.chulsooya.server.domain.cart.CartItem;
import com.chulsooya.server.domain.cart.CartRepository;
import com.chulsooya.server.domain.catalog.Product;
import com.chulsooya.server.domain.catalog.ProductRepository;
import com.chulsooya.server.domain.matching.OfferDispatchService;
import com.chulsooya.server.domain.order.OrderDtos.CreateOrderRequest;
import com.chulsooya.server.domain.order.OrderDtos.OrderItemResponse;
import com.chulsooya.server.domain.order.OrderDtos.OrderResponse;
import com.chulsooya.server.domain.order.OrderDtos.OrderSummaryResponse;
import com.chulsooya.server.domain.store.Store;
import com.chulsooya.server.domain.store.StoreRepository;

@Service
public class OrderService {

	private final OrderRepository orderRepository;
	private final CartRepository cartRepository;
	private final ProductRepository productRepository;
	private final StoreRepository storeRepository;
	private final OfferDispatchService offerDispatchService;
	private final PaymentRefundService paymentRefundService;
	private final CouponService couponService;
	private final AppProperties properties;
	private final Clock clock;

	public OrderService(OrderRepository orderRepository,
			CartRepository cartRepository,
			ProductRepository productRepository,
			StoreRepository storeRepository,
			OfferDispatchService offerDispatchService,
			PaymentRefundService paymentRefundService,
			CouponService couponService,
			AppProperties properties,
			Clock clock) {
		this.orderRepository = orderRepository;
		this.cartRepository = cartRepository;
		this.productRepository = productRepository;
		this.storeRepository = storeRepository;
		this.offerDispatchService = offerDispatchService;
		this.paymentRefundService = paymentRefundService;
		this.couponService = couponService;
		this.properties = properties;
		this.clock = clock;
	}

	/**
	 * 장바구니 -> 주문 요청. 가격 스냅샷을 고정하고 WAITING_MATCH 로 전이한 뒤 제안을 발송한다.
	 */
	@Transactional
	public OrderResponse requestMatching(Long consumerId, CreateOrderRequest request) {
		Instant now = clock.instant();

		Cart cart = cartRepository.findByConsumerIdAndActiveTrue(consumerId)
				.orElseThrow(() -> new DomainException(ErrorCode.CART_EMPTY));
		if (cart.getItems().isEmpty()) {
			throw new DomainException(ErrorCode.CART_EMPTY);
		}
		if (request.guCode() == null || request.guCode().isBlank()) {
			throw new DomainException(ErrorCode.GU_CODE_UNRESOLVED);
		}
		if (request.fulfillmentMethod() == FulfillmentMethod.DELIVERY
				&& (request.address() == null || request.address().isBlank())) {
			throw new DomainException(ErrorCode.ADDRESS_REQUIRED);
		}

		Map<Long, Product> products = productRepository
				.findAllById(cart.getItems().stream().map(CartItem::getProductId).toList())
				.stream()
				.collect(Collectors.toMap(Product::getId, Function.identity()));

		Order order = new Order(consumerId, request.guCode(), request.fulfillmentMethod(),
				request.address(), request.addressDetail(), request.requestMemo(),
				properties.delivery().fee());

		for (CartItem item : cart.getItems()) {
			Product product = products.get(item.getProductId());
			if (product == null || !product.isActive()) {
				throw new DomainException(ErrorCode.PRODUCT_INACTIVE,
						"판매 중지된 상품이 장바구니에 있습니다. 장바구니를 확인해 주세요.");
			}
			order.addItem(new OrderItem(product.getId(), product.getName(), product.getSpecSummary(),
					product.getUnit(), item.getQuantity(), product.getPrice()));
		}
			// 클라이언트 discountAmount는 신뢰하지 않는다. 할인은 서버가 소유권·만료를 검증한 쿠폰으로만 확정한다.
			order.submitForMatching(now, properties.matching().matchWindowSeconds());
			Order saved = orderRepository.save(order);
			if (request.couponIssueId() != null) {
				couponService.applyToOrder(consumerId, request.couponIssueId(), saved);
			}

		cart.clear();
		cart.deactivate();
		cartRepository.save(cart);

		offerDispatchService.dispatch(saved);
		return toResponse(saved);
	}

	@Transactional(readOnly = true)
	public OrderResponse get(Long orderId, Long requesterId, boolean privileged) {
		Order order = orderRepository.findById(orderId)
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "주문을 찾을 수 없습니다."));
		boolean isOwner = order.getConsumerId().equals(requesterId);
		if (!isOwner && !privileged) {
			throw new DomainException(ErrorCode.FORBIDDEN);
		}
		return toResponse(order);
	}

	@Transactional(readOnly = true)
	public List<OrderSummaryResponse> listByConsumer(Long consumerId) {
		return orderRepository.findByConsumerIdOrderByIdDesc(consumerId).stream()
				.map(this::toSummary)
				.toList();
	}

	@Transactional
	public OrderResponse cancel(Long orderId, Long consumerId, String idempotencyKey) {
		return toResponse(paymentRefundService.cancelByConsumer(orderId, consumerId, idempotencyKey));
	}

	/** 낙찰 판매자의 이행 상태 전이 (준비/배달/픽업/완료). */
	@Transactional
	public OrderResponse advanceFulfillment(Long orderId, Long storeId, OrderStatus next) {
		Instant now = clock.instant();
		Order order = orderRepository.findByIdForUpdate(orderId)
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "주문을 찾을 수 없습니다."));
		if (order.getWinningStoreId() == null || !order.getWinningStoreId().equals(storeId)) {
			throw new DomainException(ErrorCode.FORBIDDEN, "낙찰 판매자만 이행 상태를 변경할 수 있습니다.");
		}
		order.transitionTo(next, now);
		if (next == OrderStatus.COMPLETED) {
			storeRepository.findByIdForUpdate(storeId).ifPresent(Store::releaseActiveSlot);
		}
		return toResponse(order);
	}

	public OrderResponse toResponse(Order order) {
		String storeName = order.getWinningStoreId() == null
				? null
				: storeRepository.findById(order.getWinningStoreId()).map(Store::getName).orElse(null);

		return new OrderResponse(
				order.getId(),
				order.getStatus(),
				order.getFulfillmentMethod(),
				order.getGuCode(),
				order.getAddress(),
				order.getAddressDetail(),
				order.getRequestMemo(),
				order.getItemsAmount(),
				order.getDeliveryFee(),
									order.getDiscountAmount(),
					order.getCouponIssueId(),
					order.getTotalAmount(),

				order.getWinningStoreId(),
				storeName,
				order.getMatchDeadlineAt(),
				order.getSellerConfirmationDeadlineAt(),
				order.getMatchedAt(),
				order.getSellerConfirmedAt(),
				order.getPaidAt(),
				order.getCompletedAt(),
				order.getRetryCount(),
				order.getCreatedAt(),
				clock.instant(),
				order.getItems().stream().map(OrderItemResponse::from).toList());
	}

	private OrderSummaryResponse toSummary(Order order) {
		int itemCount = order.getItems().stream().mapToInt(OrderItem::getQuantity).sum();
		String representative = order.getItems().isEmpty() ? "" : order.getItems().get(0).getProductName();
		return new OrderSummaryResponse(order.getId(), order.getStatus(), order.getTotalAmount(),
				itemCount, representative, order.getCreatedAt());
	}
}
