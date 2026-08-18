package com.chulsooya.server.domain.cart;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chulsooya.server.common.ApiResponse;
import com.chulsooya.server.domain.cart.CartDtos.AddItemRequest;
import com.chulsooya.server.domain.cart.CartDtos.CartResponse;
import com.chulsooya.server.domain.cart.CartDtos.UpdateQuantityRequest;
import com.chulsooya.server.domain.cart.CartDtos.UpdatePriceTierAgreementRequest;
import com.chulsooya.server.support.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/cart")
public class CartController {

	private final CartService cartService;

	public CartController(CartService cartService) {
		this.cartService = cartService;
	}

	@GetMapping
	public ApiResponse<CartResponse> view(CurrentUser user) {
		return ApiResponse.of(cartService.view(user.userId()));
	}

	@PostMapping("/items")
	public ApiResponse<CartResponse> add(CurrentUser user, @Valid @RequestBody AddItemRequest request) {
		return ApiResponse.of(cartService.addItem(
				user.userId(), request.productId(), request.optionHash(), request.priceTierId(), request.quantity()));
	}

        @PostMapping("/price-tier-agreement")
        public ApiResponse<CartResponse> agreePriceTierSupply(CurrentUser user) {
                return ApiResponse.of(cartService.agreePriceTierSupply(user.userId()));
        }
    @PatchMapping("/price-tier-agreement")
    public ApiResponse<CartResponse> updatePriceTierAgreement(CurrentUser user, @RequestBody UpdatePriceTierAgreementRequest request) {
            return ApiResponse.of(cartService.updatePriceTierAgreement(user.userId(), request.agreed()));
    }
    @PatchMapping("/items/{cartItemId}")
	public ApiResponse<CartResponse> updateQuantity(CurrentUser user,
			@PathVariable Long cartItemId,
			@Valid @RequestBody UpdateQuantityRequest request) {
		return ApiResponse.of(cartService.changeQuantity(user.userId(), cartItemId, request.quantity()));
	}

	@DeleteMapping("/items/{cartItemId}")
	public ApiResponse<CartResponse> remove(CurrentUser user, @PathVariable Long cartItemId) {
		return ApiResponse.of(cartService.removeItem(user.userId(), cartItemId));
	}
        @DeleteMapping
        public ApiResponse<CartResponse> clear(CurrentUser user) {
                return ApiResponse.of(cartService.clear(user.userId()));
        }
}
