create table if not exists popup_notices (
    id bigserial primary key,
    title varchar(120) not null,
    content text not null,
    is_active boolean not null default false,
    display_start_at timestamptz null,
    display_end_at timestamptz null,
    updated_by_user_id bigint null references users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ck_popup_notice_display_window check (
        display_start_at is null or display_end_at is null or display_end_at > display_start_at
    )
);

create unique index if not exists uq_popup_notices_single_active
    on popup_notices (is_active)
    where is_active = true;

create index if not exists idx_popup_notices_updated_at
    on popup_notices (updated_at desc);
