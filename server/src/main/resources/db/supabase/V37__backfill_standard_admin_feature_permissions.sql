insert into user_feature_permissions (user_id, permission_code, enabled, updated_at)
select u.id, codes.permission_code, true, now()
from users u
cross join lateral (
    values
        ('ADMIN_MANAGE_CONSUMERS'),
        ('ADMIN_MANAGE_SELLERS'),
        ('ADMIN_MANAGE_STORES'),
        ('ADMIN_REVIEW_SELLER_APPLICATIONS'),
        ('ADMIN_MANAGE_CATALOG'),
        ('ADMIN_MANAGE_EVENTS_AND_COUPONS'),
        ('ADMIN_MANAGE_SUBSCRIPTIONS'),
        ('ADMIN_VIEW_MATCHING'),
        ('ADMIN_MANAGE_SETTLEMENTS'),
        ('ADMIN_MANAGE_SUPPORT'),
        ('ADMIN_APPROVE_DEVELOPMENT_PAYMENTS')
) as codes(permission_code)
where u.role = 'ADMIN' and coalesce(u.admin_level, 'NONE') <> 'HIGHEST'
on conflict (user_id, permission_code) do nothing;
