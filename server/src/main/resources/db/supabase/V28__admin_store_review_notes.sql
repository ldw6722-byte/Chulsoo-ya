CREATE TABLE IF NOT EXISTS admin_store_review_notes (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  author_id BIGINT NOT NULL REFERENCES users(id),
  content VARCHAR(1000) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_store_review_notes_store_created
  ON admin_store_review_notes(store_id, created_at DESC);
