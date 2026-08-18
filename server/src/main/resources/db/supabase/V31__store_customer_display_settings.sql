alter table stores add column if not exists directory_visible boolean not null default true;
alter table stores add column if not exists customer_badge_text varchar(60);
alter table stores add column if not exists customer_notice_text varchar(200);
