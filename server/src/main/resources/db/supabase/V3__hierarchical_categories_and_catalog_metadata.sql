-- Kordeal식 3단 메뉴와 철수야 철물 상품 판매 정보를 위한 비파괴 확장

alter table categories add column if not exists parent_id bigint references categories(id);
alter table categories add column if not exists level integer not null default 1;
alter table categories add column if not exists image_url varchar(500);
alter table categories add column if not exists active boolean not null default true;
create index if not exists ix_categories_parent_sort on categories(parent_id, sort_order);
create index if not exists ix_categories_active_level on categories(active, level, sort_order);

alter table products add column if not exists description varchar(2000);
alter table products add column if not exists specification varchar(2000);
alter table products add column if not exists original_price integer;
alter table products add column if not exists discount_rate integer;
alter table products add column if not exists image_urls varchar(2000);
alter table products add column if not exists brand varchar(100);
alter table products add column if not exists rating double precision not null default 0;
alter table products add column if not exists review_count integer not null default 0;
alter table products add column if not exists sales_count integer not null default 0;
alter table products add column if not exists featured boolean not null default false;
alter table products add column if not exists quick_fulfillment boolean not null default false;
alter table products add column if not exists created_at timestamptz not null default now();

update products set original_price = price where original_price is null;
update products set discount_rate = 0 where discount_rate is null;
update products set image_urls = image_url where image_urls is null and image_url is not null;

create index if not exists ix_products_featured_active on products(active, featured, id desc);
create index if not exists ix_products_popular_active on products(active, sales_count desc);
create index if not exists ix_products_new_active on products(active, created_at desc);
