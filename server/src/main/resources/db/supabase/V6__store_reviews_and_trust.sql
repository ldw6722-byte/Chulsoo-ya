CREATE TABLE IF NOT EXISTS store_reviews (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL REFERENCES stores(id),
    order_id BIGINT NOT NULL REFERENCES orders(id),
    consumer_id BIGINT NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment VARCHAR(1000),
    trust_delta DOUBLE PRECISION NOT NULL DEFAULT 0,
    visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    moderation_reason VARCHAR(300),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    moderated_at TIMESTAMPTZ,
    moderated_by BIGINT REFERENCES users(id),
    CONSTRAINT uk_store_reviews_order UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_store_reviews_store_visibility_created
    ON store_reviews(store_id, visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_reviews_consumer_created
    ON store_reviews(consumer_id, created_at DESC);

-- 후기 기반 별점으로 전환한다. 기존 디렉터리 목별점은 공개 후기가 없을 때 0으로 보인다.
UPDATE stores SET rating = 0 WHERE rating IS NULL OR rating <> 0;
