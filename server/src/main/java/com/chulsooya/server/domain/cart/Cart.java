package com.chulsooya.server.domain.cart;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 소비자는 활성 장바구니를 하나만 보유한다(README.ko.md 6.2 유니크 인덱스). */
@Entity
@Getter
@Table(name = "carts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Cart {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long consumerId;

	@Column(nullable = false)
	private boolean active = true;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
	@JoinColumn(name = "cart_id")
	private List<CartItem> items = new ArrayList<>();

	public Cart(Long consumerId) {
		this.consumerId = consumerId;
	}

	public Optional<CartItem> findItem(Long productId, String optionHash) {
		return items.stream()
				.filter(i -> i.getProductId().equals(productId) && i.getOptionHash().equals(optionHash))
				.findFirst();
	}

	/** 같은 상품/옵션 조합은 한 번만 존재한다. 이미 있으면 수량을 더한다. */
	public void addOrIncrease(Long productId, String optionHash, int quantity) {
		findItem(productId, optionHash).ifPresentOrElse(
				item -> item.increase(quantity),
				() -> items.add(new CartItem(productId, optionHash, quantity)));
	}

	public void removeItem(Long cartItemId) {
		items.removeIf(i -> i.getId() != null && i.getId().equals(cartItemId));
	}

	public void clear() {
		items.clear();
	}

	public void deactivate() {
		this.active = false;
	}
}
