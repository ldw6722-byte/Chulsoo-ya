package com.chulsooya.server.domain.cart;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "cart_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CartItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long productId;

	/** 옵션 없는 경우 "-". 유니크 제약(cart_id, product_id, option_hash)의 구성 요소. */
	@Column(nullable = false, length = 64)
	private String optionHash = "-";

	@Column(nullable = false)
	private int quantity;

	public CartItem(Long productId, String optionHash, int quantity) {
		validateQuantity(quantity);
		this.productId = productId;
		this.optionHash = (optionHash == null || optionHash.isBlank()) ? "-" : optionHash;
		this.quantity = quantity;
	}

	public void increase(int delta) {
		validateQuantity(this.quantity + delta);
		this.quantity += delta;
	}

	public void changeQuantity(int next) {
		validateQuantity(next);
		this.quantity = next;
	}

	private void validateQuantity(int value) {
		if (value < 1) {
			throw new DomainException(ErrorCode.INVALID_QUANTITY);
		}
	}
}
