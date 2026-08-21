update users
set admin_level = 'STANDARD',
    admin_status = 'OFFLINE',
    admin_status_updated_at = coalesce(admin_status_updated_at, now())
where role = 'ADMIN'
  and admin_level = 'NONE';
