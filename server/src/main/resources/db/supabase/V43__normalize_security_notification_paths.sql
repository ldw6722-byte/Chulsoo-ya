-- 기존 보안 경보 알림이 관리자 보안 감사 탭으로 열리도록 탭 키를 정규화한다.
UPDATE customer_notifications notification
SET target_path = '/admin?view=securityAudit'
FROM users administrator
WHERE notification.user_id = administrator.id
  AND administrator.role = 'ADMIN'
  AND notification.type = 'SECURITY_ALERT'
  AND notification.target_path = '/admin?view=security-audit';
