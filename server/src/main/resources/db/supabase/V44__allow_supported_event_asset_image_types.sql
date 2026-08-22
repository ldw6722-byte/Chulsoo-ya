-- 관리자 행사 자산 화면에서 허용하는 JPG·PNG·WebP 업로드 형식을 Storage 버킷 정책과 일치시킨다.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
WHERE id = 'event-assets';
