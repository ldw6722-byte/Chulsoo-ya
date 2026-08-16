UPDATE event_campaigns
SET icon_key = CASE hero_sort
  WHEN 1 THEN 'drill'
  WHEN 2 THEN 'saw'
  WHEN 3 THEN 'bolts'
  WHEN 4 THEN 'shower'
  WHEN 5 THEN 'fan'
  WHEN 6 THEN 'bulb'
  ELSE icon_key
END
WHERE icon_key = 'toolbox' AND hero_sort BETWEEN 1 AND 6;
