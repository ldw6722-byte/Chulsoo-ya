package com.chulsooya.server.domain.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 변경 불가능한 가격 스냅샷을 보관한다. */
@Entity
@Getter
@Table(name = "order_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {

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

	public OrderItem(Long productId, String productName, String specSummary, String unit,
			int quantity, int priceAtOrder) {
		this.productId = productId;
		this.productName = productName;
		this.specSummary = specSummary;
		this.unit = unit;
		this.quantity = quantity;
		this.priceAtOrder = priceAtOrder;
	}

	public int getLineAmount() {
		return quantity * priceAtOrder;
	}
}
