alter table stores add column if not exists city_name varchar(60) not null default '서울특별시';
alter table stores add column if not exists district_name varchar(60);
alter table stores add column if not exists image_url varchar(500);
alter table stores add column if not exists handled_items varchar(1000) not null default '철물,공구';
alter table stores add column if not exists rating double precision not null default 4.0 check (rating >= 0 and rating <= 5);
update stores set district_name = coalesce(district_name, '강남구') where district_name is null;
create index if not exists ix_stores_directory on stores(city_name, district_name, verified, rating desc);
