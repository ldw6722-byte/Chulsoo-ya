ALTER TABLE products ADD COLUMN IF NOT EXISTS supply_cost INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS select_promotion BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE products SET supply_cost = original_price WHERE supply_cost IS NULL AND original_price IS NOT NULL;
