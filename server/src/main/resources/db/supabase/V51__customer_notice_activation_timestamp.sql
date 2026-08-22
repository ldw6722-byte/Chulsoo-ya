alter table customer_notices
    add column if not exists activated_at timestamptz;

update customer_notices
set activated_at = updated_at
where is_active = true and activated_at is null;
