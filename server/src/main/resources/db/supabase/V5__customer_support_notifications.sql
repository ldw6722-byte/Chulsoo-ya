CREATE TABLE IF NOT EXISTS support_inquiries (
    id BIGSERIAL PRIMARY KEY,
    consumer_id BIGINT NOT NULL,
    category VARCHAR(30) NOT NULL,
    title VARCHAR(120) NOT NULL,
    content VARCHAR(3000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    admin_reply VARCHAR(3000),
    reply_admin_id BIGINT,
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_inquiries_consumer_created ON support_inquiries (consumer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_inquiries_status_created ON support_inquiries (status, created_at DESC);

CREATE TABLE IF NOT EXISTS customer_notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(160) NOT NULL,
    content VARCHAR(1000) NOT NULL,
    target_path VARCHAR(240),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_notifications_user_created ON customer_notifications (user_id, created_at DESC);
