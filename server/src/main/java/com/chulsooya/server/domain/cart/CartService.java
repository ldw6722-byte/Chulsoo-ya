package com.chulsooya.server.domain.cart;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;
import com.chulsooya.server.domain.cart.CartDtos.CartItemResponse;
import com.chulsooya.server.domain.cart.CartDtos.CartResponse;
import com.chulsooya.server.domain.catalog.Product;
import com.chulsooya.server.domain.catalog.ProductRepository;

@Service
public class CartService {

	private final CartRepository cartRepository;
	private final ProductRepository productRepository;

	public CartService(CartRepository cartRepository, ProductRepository productRepository) {
		this.cartRepository = cartRepository;
		this.productRepository = productRepository;
	}

	@Transactional
	public Cart getOrCreateActiveCart(Long consumerId) {
		return cartRepository.findByConsumerIdAndActiveTrue(consumerId)
				.orElseGet(() -> cartRepository.save(new Cart(consumerId)));
	}

	@Transactional
	public CartResponse addItem(Long consumerId, Long productId, String optionHash, int quantity) {
		Product product = productRepository.findById(productId)
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "상품을 찾을 수 없습니다."));
		if (!product.isActive()) {
			throw new DomainException(ErrorCode.PRODUCT_INACTIVE);
		}
		Cart cart = getOrCreateActiveCart(consumerId);
		cart.addOrIncrease(productId, optionHash, quantity);
		return toResponse(cartRepository.save(cart));
	}

	@Transactional
	public CartResponse changeQuantity(Long consumerId, Long cartItemId, int quantity) {
		Cart cart = requireActiveCart(consumerId);
		CartItem item = cart.getItems().stream()
				.filter(i -> i.getId().equals(cartItemId))
				.findFirst()
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "장바구니 품목을 찾을 수 없습니다."));
		item.changeQuantity(quantity);
		return toResponse(cartRepository.save(cart));
	}

	@Transactional
	public CartResponse removeItem(Long consumerId, Long cartItemId) {
		Cart cart = requireActiveCart(consumerId);
		cart.removeItem(cartItemId);
		return toResponse(cartRepository.save(cart));
	}

	@Transactional(readOnly = true)
	public CartResponse view(Long consumerId) {
		return cartRepository.findByConsumerIdAndActiveTrue(consumerId)
				.map(this::toResponse)
				.orElseGet(() -> new CartResponse(null, List.of(), 0, 0));
	}

	private Cart requireActiveCart(Long consumerId) {
		return cartRepository.findByConsumerIdAndActiveTrue(consumerId)
				.orElseThrow(() -> new DomainException(ErrorCode.CART_EMPTY));
	}

	public CartResponse toResponse(Cart cart) {
		List<Long> productIds = cart.getItems().stream().map(CartItem::getProductId).distinct().toList();
		Map<Long, Product> products = productRepository.findAllById(productIds).stream()
				.collect(Collectors.toMap(Product::getId, Function.identity()));

		List<CartItemResponse> items = cart.getItems().stream()
				.filter(i -> products.containsKey(i.getProductId()))
				.map(i -> {
					Product p = products.get(i.getProductId());
					return new CartItemResponse(
							i.getId(),
							p.getId(),
							p.getName(),
							p.getSpecSummary(),
							p.getUnit(),
							p.getImageUrl(),
							i.getOptionHash(),
							i.getQuantity(),
							p.getPrice(),
							p.getPrice() * i.getQuantity());
				})
				.toList();

		int amount = items.stream().mapToInt(CartItemResponse::lineAmount).sum();
		int count = items.stream().mapToInt(CartItemResponse::quantity).sum();
		return new CartResponse(cart.getId(), items, amount, count);
	}
}
