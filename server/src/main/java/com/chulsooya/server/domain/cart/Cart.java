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

/** ???돩?癒?뮉 ??뽮쉐 ?貫而?뤃??꿰몴???롪돌筌?癰귣똻???뺣뼄(README.ko.md 6.2 ?醫딅빍???紐껊쑔??. */
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
        @Column(nullable = false) private boolean priceTierAgreed = false;
        private Instant priceTierAgreedAt;

	@OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<CartItem> items = new ArrayList<>();

	public Cart(Long consumerId) {
		this.consumerId = consumerId;
	}

	public Optional<CartItem> findItem(Long productId, String optionHash) {
		return items.stream()
				.filter(i -> i.getProductId().equals(productId) && i.getOptionHash().equals(optionHash))
				.findFirst();
	}

	/** 揶쏆늿? ?怨밸?/????鈺곌퀬鍮?? ??甕곕뜄彛?鈺곕똻???뺣뼄. ??? ??됱몵筌???롮쎗???酉釉?? */
        public void addOrIncrease(Long productId, String optionHash, Long priceTierId, String priceTierLabel, int priceTierPrice, String priceTierBrands, int quantity) {
                String normalized = optionHash == null || optionHash.isBlank() ? "-" : optionHash;
                findItem(productId, normalized).filter(i -> i.getPriceTierId().equals(priceTierId)).ifPresentOrElse(i -> i.increase(quantity), () -> items.add(new CartItem(this, productId, normalized, priceTierId, priceTierLabel, priceTierPrice, priceTierBrands, quantity)));
                priceTierAgreed = false; priceTierAgreedAt = null;
        }
        public void agreeToPriceTierSupply(Instant now) { setPriceTierAgreement(true, now); }
        public void setPriceTierAgreement(boolean agreed, Instant now) {
                priceTierAgreed = agreed;
                priceTierAgreedAt = agreed ? now : null;
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
