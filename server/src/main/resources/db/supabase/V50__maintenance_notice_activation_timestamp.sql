alter table maintenance_notices
    add column if not exists activated_at timestamptz;

update maintenance_notices
set activated_at = updated_at
where active = true and activated_at is null;
