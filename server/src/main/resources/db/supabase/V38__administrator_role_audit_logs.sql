create table if not exists administrator_role_audit_logs (
    id bigserial primary key,
    actor_user_id bigint not null references users(id),
    target_user_id bigint not null references users(id),
    action varchar(32) not null,
    previous_role varchar(20) not null,
    previous_admin_level varchar(20) not null,
    next_role varchar(20) not null,
    next_admin_level varchar(20) not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_administrator_role_audits_target_created
    on administrator_role_audit_logs(target_user_id, created_at desc);
create index if not exists idx_administrator_role_audits_actor_created
    on administrator_role_audit_logs(actor_user_id, created_at desc);
