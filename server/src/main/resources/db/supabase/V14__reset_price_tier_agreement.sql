-- Existing carts must receive the new price-tier supply disclosure before ordering.
UPDATE carts SET price_tier_agreed = FALSE, price_tier_agreed_at = NULL WHERE price_tier_agreed = TRUE;
