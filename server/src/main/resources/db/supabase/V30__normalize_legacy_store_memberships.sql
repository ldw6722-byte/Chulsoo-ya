-- Legacy tier values were development matching priorities, not paid subscription records.
-- A seller without a subscription expiry is a non-subscriber and must start at SILVER.
update stores
set tier = 'SILVER', subscription_expires_at = null
where subscription_expires_at is null
  and tier in ('PREMIUM', 'GOLD', 'SILVER');

-- Historical open offers are no longer actionable, but normalize their tier labels for audit consistency.
update match_offers
set tier = 'GOLD'
where tier = 'STANDARD';

update match_offers
set tier = 'SILVER'
where tier = 'FREE';
