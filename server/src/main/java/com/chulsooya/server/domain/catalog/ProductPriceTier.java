package com.chulsooya.server.domain.catalog;
import jakarta.persistence.*;
import lombok.*;
@Entity @Getter @Table(name = "product_price_tiers") @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductPriceTier {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "product_id", nullable = false) private Product product;
  @Column(nullable = false, length = 80) private String label;
  @Column(name = "sale_price", nullable = false) private int salePrice;
  @Column(name = "guide_brands", nullable = false, length = 1000) private String guideBrands;
  @Column(name = "guide_message", nullable = false, length = 1000) private String guideMessage;
  @Column(name = "sort_order", nullable = false) private int sortOrder;
  @Column(nullable = false) private boolean active = true;
  public ProductPriceTier(Product product, String label, int salePrice, String guideBrands, String guideMessage, int sortOrder) { update(product, label, salePrice, guideBrands, guideMessage, sortOrder); }
  public void update(Product product, String label, int salePrice, String guideBrands, String guideMessage, int sortOrder) { this.product = product; this.label = label; this.salePrice = salePrice; this.guideBrands = guideBrands; this.guideMessage = guideMessage; this.sortOrder = sortOrder; this.active = true; }
  public void deactivate() { this.active = false; }
}
