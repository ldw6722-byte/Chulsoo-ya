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
import com.chulsooya.server.domain.catalog.ProductPriceTier;
import com.chulsooya.server.domain.catalog.ProductPriceTierRepository;

@Service
public class CartService {

	private final CartRepository cartRepository;
	private final ProductRepository productRepository;
        private final ProductPriceTierRepository priceTierRepository;

	public CartService(CartRepository cartRepository, ProductRepository productRepository, ProductPriceTierRepository priceTierRepository) {
		this.cartRepository = cartRepository;
		this.productRepository = productRepository;
                this.priceTierRepository = priceTierRepository;
	}

	@Transactional
	public Cart getOrCreateActiveCart(Long consumerId) {
		return cartRepository.findByConsumerIdAndActiveTrue(consumerId)
				.orElseGet(() -> cartRepository.save(new Cart(consumerId)));
	}

	@Transactional
	public CartResponse addItem(Long consumerId, Long productId, String optionHash, Long priceTierId, int quantity) {
		Product product = productRepository.findById(productId)
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "??⑤갭???嶺뚢돦堉??????怨룸????덈펲."));
		if (!product.isActive()) {
			throw new DomainException(ErrorCode.PRODUCT_INACTIVE);
		}
                ProductPriceTier tier = (priceTierId == null ? priceTierRepository.findByProductIdAndActiveTrueOrderBySortOrderAsc(productId).stream().findFirst() : priceTierRepository.findByIdAndProductIdAndActiveTrue(priceTierId, productId)).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND));
		Cart cart = getOrCreateActiveCart(consumerId);
		cart.addOrIncrease(productId, optionHash, tier.getId(), tier.getLabel(), tier.getSalePrice(), tier.getGuideBrands(), quantity);
		return toResponse(cartRepository.save(cart));
	}

	@Transactional
	public CartResponse changeQuantity(Long consumerId, Long cartItemId, int quantity) {
		Cart cart = requireActiveCart(consumerId);
		CartItem item = cart.getItems().stream()
				.filter(i -> i.getId().equals(cartItemId))
				.findFirst()
				.orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "?縕ヨ?琉??????嫄??嶺뚢돦堉??????怨룸????덈펲."));
		item.changeQuantity(quantity);
		return toResponse(cartRepository.save(cart));
	}

	@Transactional
	public CartResponse removeItem(Long consumerId, Long cartItemId) {
		Cart cart = requireActiveCart(consumerId);
		cart.removeItem(cartItemId);
		return toResponse(cartRepository.save(cart));
	}

	    @Transactional
    public CartResponse clear(Long consumerId) {
            Cart cart = requireActiveCart(consumerId);
            cart.clear();
            return toResponse(cartRepository.save(cart));
    }

@Transactional(readOnly = true)
	public CartResponse view(Long consumerId) {
		return cartRepository.findByConsumerIdAndActiveTrue(consumerId)
				.map(this::toResponse)
				.orElseGet(() -> new CartResponse(null, List.of(), 0, 0, false));
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
                                                        i.getPriceTierId(),
                                                        i.getPriceTierLabel(),
                                                        i.getPriceTierBrands(),
							i.getQuantity(),
                                                        i.getPriceTierPrice(),
                                                        i.getPriceTierPrice() * i.getQuantity());
				})
				.toList();

		int amount = items.stream().mapToInt(CartItemResponse::lineAmount).sum();
		int count = items.stream().mapToInt(CartItemResponse::quantity).sum();
		return new CartResponse(cart.getId(), items, amount, count, cart.isPriceTierAgreed());
	}
        @Transactional
        public CartResponse agreePriceTierSupply(Long consumerId) {
                return updatePriceTierAgreement(consumerId, true);
        }
        @Transactional
        public CartResponse updatePriceTierAgreement(Long consumerId, boolean agreed) {
                Cart cart = requireActiveCart(consumerId);
                cart.setPriceTierAgreement(agreed, java.time.Instant.now());
                return toResponse(cartRepository.save(cart));
        }
}
