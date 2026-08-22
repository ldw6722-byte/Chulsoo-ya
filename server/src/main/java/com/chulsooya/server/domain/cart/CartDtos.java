package com.chulsooya.server.domain.cart;
import java.util.List;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
public final class CartDtos {
  private CartDtos() {}
  public record AddItemRequest(@NotNull Long productId, String optionHash, Long priceTierId, @NotNull @Min(1) Integer quantity) {}
  public record UpdateQuantityRequest(@NotNull @Min(1) Integer quantity) {}
  public record UpdatePriceTierAgreementRequest(boolean agreed) {}
  public record CartItemResponse(Long id, Long productId, String productName, String specSummary, String unit, String imageUrl, boolean active, String optionHash, Long priceTierId, String priceTierLabel, String priceTierBrands, int quantity, int unitPrice, int lineAmount) {}
  public record CartResponse(Long cartId, List<CartItemResponse> items, int itemsAmount, int itemCount, boolean priceTierAgreed) {}
}
