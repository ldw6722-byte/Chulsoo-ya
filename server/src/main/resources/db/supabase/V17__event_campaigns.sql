CREATE TABLE event_campaigns (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hero_title VARCHAR(160) NOT NULL,
    hero_subtitle VARCHAR(300),
    hero_sort INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    hero_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_event_campaigns_hero ON event_campaigns (active, hero_enabled, hero_sort);

ALTER TABLE products ADD COLUMN IF NOT EXISTS event_campaign_id BIGINT;
ALTER TABLE products ADD CONSTRAINT fk_products_event_campaign
    FOREIGN KEY (event_campaign_id) REFERENCES event_campaigns(id);
CREATE INDEX idx_products_event_campaign ON products (event_campaign_id);

INSERT INTO event_campaigns (name, hero_title, hero_subtitle, hero_sort, active, hero_enabled) VALUES
    ('전동·충전공구 행사', '전동·충전공구 특가', '현장 작업에 필요한 전동공구를 행사 가격으로 만나보세요.', 1, TRUE, TRUE),
    ('도어·창호 행사', '도어·창호 교체 기획전', '도어락과 창호 보수 자재를 한 번에 준비하세요.', 2, TRUE, TRUE),
    ('철물 고정자재 행사', '철물 고정자재 행사', '앵커·나사·볼트 등 현장 필수 자재를 모았습니다.', 3, TRUE, TRUE),
    ('욕실 꾸미기 행사전', '욕실 꾸미기 행사전', '욕실 분위기 전환에 필요한 자재를 확인해 보세요.', 4, TRUE, TRUE),
    ('여름 대비 행사', '여름 대비 행사', '환풍·배수·생활철물 행사 상품을 준비했습니다.', 5, TRUE, TRUE);
