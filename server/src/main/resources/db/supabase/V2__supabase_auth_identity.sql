-- 기존 V1 스키마에 Supabase Auth 식별자를 추가하는 비파괴 마이그레이션.
-- Supabase SQL Editor에서 V1 적용 후 한 번 실행한다.

alter table users add column if not exists supabase_user_id uuid;
create unique index if not exists ux_users_supabase_user_id
    on users (supabase_user_id)
    where supabase_user_id is not null;

