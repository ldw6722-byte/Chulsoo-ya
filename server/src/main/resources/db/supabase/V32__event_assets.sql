CREATE TABLE event_assets (
    id BIGSERIAL PRIMARY KEY,
    asset_type VARCHAR(12) NOT NULL,
    name VARCHAR(100) NOT NULL,
    storage_key VARCHAR(255) NOT NULL UNIQUE,
    public_url VARCHAR(700) NOT NULL,
    source_type VARCHAR(24) NOT NULL DEFAULT 'ADMIN_UPLOAD',
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_event_assets_type CHECK (asset_type IN ('THEME', 'ICON')),
    CONSTRAINT ck_event_assets_source CHECK (source_type IN ('ADMIN_UPLOAD', 'AI_GENERATED'))
);
CREATE INDEX idx_event_assets_list ON event_assets (asset_type, active, sort_order, id);
ALTER TABLE event_campaigns ADD COLUMN IF NOT EXISTS theme_asset_id BIGINT;
ALTER TABLE event_campaigns ADD COLUMN IF NOT EXISTS icon_asset_id BIGINT;
ALTER TABLE event_campaigns ADD CONSTRAINT fk_event_campaigns_theme_asset
    FOREIGN KEY (theme_asset_id) REFERENCES event_assets(id);
ALTER TABLE event_campaigns ADD CONSTRAINT fk_event_campaigns_icon_asset
    FOREIGN KEY (icon_asset_id) REFERENCES event_assets(id);
CREATE INDEX idx_event_campaigns_theme_asset ON event_campaigns (theme_asset_id);
CREATE INDEX idx_event_campaigns_icon_asset ON event_campaigns (icon_asset_id);
