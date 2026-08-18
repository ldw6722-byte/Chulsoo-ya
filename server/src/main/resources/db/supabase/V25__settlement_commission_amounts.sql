alter table settlements add column if not exists commission_rate_bps integer not null default 1000;
alter table settlements add column if not exists commission_amount integer not null default 0;
alter table settlements add column if not exists refunded_amount integer not null default 0;
alter table settlements add column if not exists seller_payable_amount integer not null default 0;

update settlements
set commission_amount = ((gross_amount - refunded_amount) * commission_rate_bps) / 10000,
    seller_payable_amount = (gross_amount - refunded_amount) - (((gross_amount - refunded_amount) * commission_rate_bps) / 10000)
where seller_payable_amount = 0 and gross_amount > 0;
