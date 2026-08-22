-- Initial administrator-managed subscription products.
-- ponytail: seed only when each tier has no product; later CRUD edits remain authoritative.
insert into subscription_products (name, tier, price, duration_months, description, active, display_order)
select '골드 운영 플랜', 'GOLD', 39000, 1,
       '최대 8슬롯과 주문 공개 30초 후 수신을 제공하는 판매점 운영 플랜입니다.', true, 10
where not exists (select 1 from subscription_products where tier = 'GOLD');

insert into subscription_products (name, tier, price, duration_months, description, active, display_order)
select '프리미엄 운영 플랜', 'PREMIUM', 79000, 1,
       '최대 15슬롯과 주문 즉시 공개를 제공하는 우선 운영 플랜입니다.', true, 20
where not exists (select 1 from subscription_products where tier = 'PREMIUM');
