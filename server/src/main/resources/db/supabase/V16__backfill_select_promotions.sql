-- Existing products already store discount campaigns as original_price > price.
-- Promote them to Chulsoo-ya Select while retaining the original regular price and current sale price.
UPDATE products
SET select_promotion = TRUE,
    supply_cost = original_price
WHERE original_price IS NOT NULL
  AND original_price > price
  AND select_promotion = FALSE;

-- Keep generated default option prices aligned with the product's current campaign sale price.
UPDATE product_price_tiers AS tier
SET sale_price = product.price
FROM products AS product
WHERE tier.product_id = product.id
  AND product.select_promotion = TRUE
  AND tier.active = TRUE
  AND tier.sort_order = 0
  AND tier.label IN ('Basic price tier', '기본 옵션');
