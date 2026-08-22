-- 관리자 행사 자산 화면의 최대 8MB 안내와 Storage 버킷 크기 제한을 일치시킨다.
UPDATE storage.buckets
SET file_size_limit = 8388608
WHERE id = 'event-assets';
