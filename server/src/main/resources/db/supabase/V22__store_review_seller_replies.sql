ALTER TABLE store_reviews
    ADD COLUMN IF NOT EXISTS seller_reply VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS seller_replied_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS seller_replied_by BIGINT;

CREATE INDEX IF NOT EXISTS idx_store_reviews_store_created
    ON store_reviews(store_id, created_at DESC);
