package com.chulsooya.server.domain.order;

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

/** ?怨뚮뼚?????됰씭???濚왿몾????좊읈??????怨좊룴??猷?獄??怨뚮옖????筌먲퐢?? */
@Entity
@Getter
@Table(name = "order_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {
        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "order_id", nullable = false)
        private Order order;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long productId;

	@Column(nullable = false, length = 200)
	private String productName;

	@Column(length = 300)
	private String specSummary;

	@Column(length = 20)
	private String unit;

	@Column(nullable = false)
	private int quantity;

	@Column(nullable = false)
	private int priceAtOrder;
        @Column(name = "price_tier_id") private Long priceTierId;
        @Column(name = "price_tier_label", length = 80) private String priceTierLabel;
        @Column(name = "price_tier_brands", length = 1000) private String priceTierBrands;
        @Column(name = "price_tier_agreed", nullable = false) private boolean priceTierAgreed;

        public OrderItem(Long productId, String productName, String specSummary, String unit, int quantity, int priceAtOrder, Long priceTierId, String priceTierLabel, String priceTierBrands, boolean priceTierAgreed) {
		this.productId = productId;
		this.productName = productName;
		this.specSummary = specSummary;
		this.unit = unit;
		this.quantity = quantity;
		this.priceAtOrder = priceAtOrder;
                this.priceTierId = priceTierId; this.priceTierLabel = priceTierLabel; this.priceTierBrands = priceTierBrands; this.priceTierAgreed = priceTierAgreed;
	}

	public OrderItem(Long productId, String productName, String specSummary, String unit, int quantity, int priceAtOrder) { this(productId, productName, specSummary, unit, quantity, priceAtOrder, null, "기본 가격대", "", true); }
        void attachTo(Order order) {
                this.order = order;
        }
        public int getLineAmount() {
		return quantity * priceAtOrder;
	}
}
