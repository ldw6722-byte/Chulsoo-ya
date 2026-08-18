CREATE TABLE brand_assets (
    id BIGSERIAL PRIMARY KEY,
    asset_role VARCHAR(24) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    storage_key VARCHAR(255) NOT NULL UNIQUE,
    public_url VARCHAR(700) NOT NULL,
    source_type VARCHAR(24) NOT NULL DEFAULT 'AI_GENERATED',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_brand_assets_role CHECK (asset_role IN ('MAIN_LOGO', 'FAVICON')),
    CONSTRAINT ck_brand_assets_source CHECK (source_type IN ('ADMIN_UPLOAD', 'AI_GENERATED'))
);

INSERT INTO brand_assets (asset_role, name, storage_key, public_url, source_type, active)
VALUES
    (
        'MAIN_LOGO',
        '철수야 메인 로고 · 체크 테두리',
        'brand/chulsooya-main-logo-check-outline.webp',
        'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/brand/chulsooya-main-logo-check-outline.webp',
        'AI_GENERATED',
        TRUE
    ),
    (
        'FAVICON',
        '철수야 파비콘 · 체크 테두리',
        'brand/chulsooya-favicon-check-outline.webp',
        'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/brand/chulsooya-favicon-check-outline.webp',
        'AI_GENERATED',
        TRUE
    );
