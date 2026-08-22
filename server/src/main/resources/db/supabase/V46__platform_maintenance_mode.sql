create table if not exists platform_maintenance_mode (
    singleton_id bigint primary key check (singleton_id = 1),
    enabled boolean not null default false,
    updated_at timestamptz not null default now(),
    updated_by_user_id bigint references users(id)
);

insert into platform_maintenance_mode (singleton_id, enabled)
values (1, false)
on conflict (singleton_id) do nothing;
