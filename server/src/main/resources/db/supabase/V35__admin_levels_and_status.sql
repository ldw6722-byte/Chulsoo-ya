-- 관리자 권한은 기존 users.role=ADMIN을 유지하고, 세부 등급·운영 상태만 분리 저장한다.
alter table users
    add column if not exists admin_level varchar(20) not null default 'NONE',
    add column if not exists admin_status varchar(20) not null default 'OFFLINE',
    add column if not exists admin_status_updated_at timestamptz;

alter table users
    drop constraint if exists ck_users_admin_level;
alter table users
    add constraint ck_users_admin_level check (admin_level in ('NONE', 'HIGHEST', 'STANDARD'));

alter table users
    drop constraint if exists ck_users_admin_status;
alter table users
    add constraint ck_users_admin_status check (admin_status in ('WORKING', 'AWAY', 'OFFLINE'));

create index if not exists ix_users_admin_level on users(role, admin_level) where role = 'ADMIN';
