package com.chulsooya.server.domain.cart;

import com.chulsooya.server.common.DomainException;
import com.chulsooya.server.common.ErrorCode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "cart_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CartItem {
        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "cart_id", nullable = false)
        private Cart cart;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long productId;

	/** ??????용뮉 野껋럩??"-". ?醫딅빍????뽯튋(cart_id, product_id, option_hash)???닌딄쉐 ?遺용꺖. */
	@Column(nullable = false, length = 64)
	private String optionHash = "-";
        @Column(name = "price_tier_id", nullable = false) private Long priceTierId;
        @Column(name = "price_tier_label", nullable = false, length = 80) private String priceTierLabel;
        @Column(name = "price_tier_price", nullable = false) private int priceTierPrice;
        @Column(name = "price_tier_brands", nullable = false, length = 1000) private String priceTierBrands;

	@Column(nullable = false)
	private int quantity;

	public CartItem(Cart cart, Long productId, String optionHash, Long priceTierId, String priceTierLabel, int priceTierPrice, String priceTierBrands, int quantity) {
                this.cart = cart;
		validateQuantity(quantity);
		this.productId = productId;
                this.priceTierId = priceTierId; this.priceTierLabel = priceTierLabel; this.priceTierPrice = priceTierPrice; this.priceTierBrands = priceTierBrands;
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
