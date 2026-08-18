CREATE TABLE IF NOT EXISTS seller_deactivation_requests (
  id BIGSERIAL PRIMARY KEY,
  seller_user_id BIGINT NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  reason VARCHAR(500),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by BIGINT REFERENCES users(id),
  rejection_reason VARCHAR(500)
);
CREATE INDEX IF NOT EXISTS idx_seller_deactivation_requests_seller_status ON seller_deactivation_requests(seller_user_id, status);
CREATE INDEX IF NOT EXISTS idx_seller_deactivation_requests_pending ON seller_deactivation_requests(status, requested_at);
