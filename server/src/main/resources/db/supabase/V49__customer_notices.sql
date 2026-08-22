create table if not exists customer_notices (
    id bigserial primary key,
    title varchar(120) not null,
    content text not null,
    is_active boolean not null default false,
    display_start_at timestamptz null,
    display_end_at timestamptz null,
    created_by_user_id bigint null references users(id) on delete set null,
    updated_by_user_id bigint null references users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ck_customer_notice_display_window check (
        display_start_at is null or display_end_at is null or display_end_at > display_start_at
    )
);

create index if not exists idx_customer_notices_visible
    on customer_notices (is_active, display_start_at, display_end_at, updated_at desc);
