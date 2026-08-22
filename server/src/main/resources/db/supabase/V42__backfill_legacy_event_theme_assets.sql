-- 기존 GPT 생성 배너 테마는 이미 event-assets Storage 버킷에 존재한다.
-- 관리자 자산 목록·새 행사 편집·삭제 보호에 편입하기 위해 DB 메타데이터와 기존 행사 연결만 백필한다.
INSERT INTO event_assets (asset_type, name, storage_key, public_url, source_type, sort_order, active)
VALUES
    ('THEME', '워크샵 코발트', 'themes/workshop-cobalt.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/workshop-cobalt.jpg', 'AI_GENERATED', 10, TRUE),
    ('THEME', '엠버 포지', 'themes/ember-forge.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/ember-forge.jpg', 'AI_GENERATED', 20, TRUE),
    ('THEME', '포레스트 크래프트', 'themes/forest-craft.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/forest-craft.jpg', 'AI_GENERATED', 30, TRUE),
    ('THEME', '미드나이트 스틸', 'themes/midnight-steel.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/midnight-steel.jpg', 'AI_GENERATED', 40, TRUE),
    ('THEME', '샌드스톤 빌드', 'themes/sandstone-build.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/sandstone-build.jpg', 'AI_GENERATED', 50, TRUE),
    ('THEME', '코퍼 파이프', 'themes/copper-pipe.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/copper-pipe.jpg', 'AI_GENERATED', 60, TRUE),
    ('THEME', '클린 일렉트릭', 'themes/clean-electric.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/clean-electric.jpg', 'AI_GENERATED', 70, TRUE),
    ('THEME', '세이프티 옐로', 'themes/safety-yellow.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/safety-yellow.jpg', 'AI_GENERATED', 80, TRUE),
    ('THEME', '레인 리페어', 'themes/rainy-repair.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/rainy-repair.jpg', 'AI_GENERATED', 90, TRUE),
    ('THEME', '스프링 리노베이션', 'themes/spring-renovation.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/spring-renovation.jpg', 'AI_GENERATED', 100, TRUE),
    ('THEME', '서머 쿨링', 'themes/summer-cooling.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/summer-cooling.jpg', 'AI_GENERATED', 110, TRUE),
    ('THEME', '어텀 우드', 'themes/autumn-wood.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/autumn-wood.jpg', 'AI_GENERATED', 120, TRUE),
    ('THEME', '윈터 인슐레이션', 'themes/winter-insulation.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/winter-insulation.jpg', 'AI_GENERATED', 130, TRUE),
    ('THEME', '퍼플 툴즈', 'themes/purple-tools.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/purple-tools.jpg', 'AI_GENERATED', 140, TRUE),
    ('THEME', '로즈 리뉴얼', 'themes/rose-renewal.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/rose-renewal.jpg', 'AI_GENERATED', 150, TRUE),
    ('THEME', '그래파이트 패스너', 'themes/graphite-fastener.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/graphite-fastener.jpg', 'AI_GENERATED', 160, TRUE),
    ('THEME', '틸 플러밍', 'themes/teal-plumbing.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/teal-plumbing.jpg', 'AI_GENERATED', 170, TRUE),
    ('THEME', '크림슨 파워', 'themes/crimson-power.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/crimson-power.jpg', 'AI_GENERATED', 180, TRUE),
    ('THEME', '아이보리 미니멀', 'themes/ivory-minimal.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/ivory-minimal.jpg', 'AI_GENERATED', 190, TRUE),
    ('THEME', '네온 나이트워크', 'themes/neon-nightwork.jpg', 'https://gvsnsnjfvtogvlyvmlkt.supabase.co/storage/v1/object/public/event-assets/themes/neon-nightwork.jpg', 'AI_GENERATED', 200, TRUE)
ON CONFLICT (storage_key) DO UPDATE
SET name = EXCLUDED.name,
    public_url = EXCLUDED.public_url,
    source_type = 'AI_GENERATED',
    sort_order = EXCLUDED.sort_order,
    active = TRUE,
    updated_at = NOW();

UPDATE event_campaigns campaign
SET theme_asset_id = asset.id
FROM event_assets asset
WHERE asset.asset_type = 'THEME'
  AND asset.storage_key = CASE campaign.theme_key
      WHEN 'workshopCobalt' THEN 'themes/workshop-cobalt.jpg'
      WHEN 'emberForge' THEN 'themes/ember-forge.jpg'
      WHEN 'forestCraft' THEN 'themes/forest-craft.jpg'
      WHEN 'midnightSteel' THEN 'themes/midnight-steel.jpg'
      WHEN 'sandstoneBuild' THEN 'themes/sandstone-build.jpg'
      WHEN 'copperPipe' THEN 'themes/copper-pipe.jpg'
      WHEN 'cleanElectric' THEN 'themes/clean-electric.jpg'
      WHEN 'safetyYellow' THEN 'themes/safety-yellow.jpg'
      WHEN 'rainyRepair' THEN 'themes/rainy-repair.jpg'
      WHEN 'springRenovation' THEN 'themes/spring-renovation.jpg'
      WHEN 'summerCooling' THEN 'themes/summer-cooling.jpg'
      WHEN 'autumnWood' THEN 'themes/autumn-wood.jpg'
      WHEN 'winterInsulation' THEN 'themes/winter-insulation.jpg'
      WHEN 'purpleTools' THEN 'themes/purple-tools.jpg'
      WHEN 'roseRenewal' THEN 'themes/rose-renewal.jpg'
      WHEN 'graphiteFastener' THEN 'themes/graphite-fastener.jpg'
      WHEN 'tealPlumbing' THEN 'themes/teal-plumbing.jpg'
      WHEN 'crimsonPower' THEN 'themes/crimson-power.jpg'
      WHEN 'ivoryMinimal' THEN 'themes/ivory-minimal.jpg'
      WHEN 'neonNightwork' THEN 'themes/neon-nightwork.jpg'
      ELSE NULL
  END;
