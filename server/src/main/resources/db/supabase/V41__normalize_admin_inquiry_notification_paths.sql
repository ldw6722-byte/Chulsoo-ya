-- 기존 관리자 고객 문의 알림이 개인 고객센터가 아닌 관리자 고객 지원 탭으로 이동하도록 정규화한다.
UPDATE customer_notifications notification
SET target_path = '/admin?view=support'
FROM users administrator
WHERE notification.user_id = administrator.id
  AND administrator.role = 'ADMIN'
  AND notification.type = 'INQUIRY_SUBMITTED'
  AND notification.target_path IS DISTINCT FROM '/admin?view=support';
