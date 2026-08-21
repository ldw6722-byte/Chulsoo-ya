alter table stores add column if not exists directions varchar(500);
alter table stores add column if not exists business_open_time time not null default '09:00';
alter table stores add column if not exists business_close_time time not null default '18:00';
alter table stores add column if not exists weekly_closed_days varchar(40) not null default '';
alter table stores add column if not exists temporary_closed boolean not null default false;

alter table stores add constraint stores_business_hours_check
    check (business_open_time < business_close_time);

create table if not exists user_feature_permissions (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    permission_code varchar(80) not null,
    enabled boolean not null default true,
    updated_by bigint references users(id) on delete set null,
    updated_at timestamptz not null default now(),
    unique (user_id, permission_code)
);

create index if not exists idx_user_feature_permissions_user_id on user_feature_permissions(user_id);

create table if not exists permission_audit_logs (
    id bigserial primary key,
    actor_user_id bigint not null references users(id),
    target_user_id bigint not null references users(id),
    permission_code varchar(80) not null,
    previous_enabled boolean,
    next_enabled boolean not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_permission_audit_logs_target_created_at
    on permission_audit_logs(target_user_id, created_at desc);

insert into user_feature_permissions (user_id, permission_code, enabled, updated_at)
select u.id, codes.permission_code, true, now()
from users u
cross join lateral (
    values
        ('CONSUMER_PURCHASE'),
        ('CONSUMER_REVIEW'),
        ('CONSUMER_SUPPORT'),
        ('CONSUMER_SELLER_APPLICATION')
) as codes(permission_code)
where u.role in ('CONSUMER', 'SELLER')
on conflict (user_id, permission_code) do nothing;

insert into user_feature_permissions (user_id, permission_code, enabled, updated_at)
select u.id, codes.permission_code, true, now()
from users u
cross join lateral (
    values
        ('SELLER_STORE_OPERATIONS'),
        ('SELLER_CATALOG'),
        ('SELLER_BID_AND_FULFILLMENT'),
        ('SELLER_SUBSCRIPTION'),
        ('SELLER_CLAIM_RESPONSE')
) as codes(permission_code)
where u.role = 'SELLER'
on conflict (user_id, permission_code) do nothing;

insert into user_feature_permissions (user_id, permission_code, enabled, updated_at)
select u.id, codes.permission_code, true, now()
from users u
cross join lateral (
    values
        ('ADMIN_MANAGE_CONSUMERS'),
        ('ADMIN_MANAGE_SELLERS'),
        ('ADMIN_MANAGE_STORES'),
        ('ADMIN_REVIEW_SELLER_APPLICATIONS'),
        ('ADMIN_MANAGE_CATALOG'),
        ('ADMIN_MANAGE_EVENTS_AND_COUPONS'),
        ('ADMIN_MANAGE_SUBSCRIPTIONS'),
        ('ADMIN_VIEW_MATCHING'),
        ('ADMIN_MANAGE_SETTLEMENTS'),
        ('ADMIN_MANAGE_SUPPORT'),
        ('ADMIN_APPROVE_DEVELOPMENT_PAYMENTS')
) as codes(permission_code)
where u.role = 'ADMIN' and u.admin_level = 'STANDARD'
on conflict (user_id, permission_code) do nothing;
