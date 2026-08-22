-- V40: 관리자 권한 거부 접근 감사 로그 및 경보 집계
-- 목적: /api/admin/** 에 권한 없이 접근한 이력을 기록하고, 반복·분산·경로변형 패턴 탐지에 사용한다.

CREATE TABLE IF NOT EXISTS admin_access_audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    -- 인증된 사용자 ID (비로그인이면 NULL)
    user_id         BIGINT,
    -- 요청 이메일 (JWT에서 추출, 비로그인이면 NULL)
    email           VARCHAR(255),
    -- 요청 IP (X-Forwarded-For 우선, 없으면 RemoteAddr)
    ip_address      VARCHAR(45) NOT NULL,
    -- 요청 HTTP 메서드
    http_method     VARCHAR(10) NOT NULL,
    -- 요청 경로 (예: /api/admin/overview)
    request_path    VARCHAR(500) NOT NULL,
    -- 거부 유형: UNAUTHENTICATED(401), FORBIDDEN_ROLE(403 역할 불일치), FORBIDDEN_FEATURE(403 기능 권한 없음)
    denial_type     VARCHAR(30) NOT NULL,
    -- User-Agent (공격 도구 식별용, 최대 512자)
    user_agent      VARCHAR(512),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_ip_created
    ON admin_access_audit_logs (ip_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_user_created
    ON admin_access_audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created
    ON admin_access_audit_logs (created_at DESC);

-- 경보 이력: 패턴 탐지 후 발송된 경보 기록 (중복 발송 방지용)
CREATE TABLE IF NOT EXISTS admin_access_alert_logs (
    id              BIGSERIAL PRIMARY KEY,
    -- 탐지된 패턴 유형: RAPID_REPEAT(단시간 반복), DISTRIBUTED_IP(분산 IP), PATH_SCAN(경로 탐색)
    alert_type      VARCHAR(40) NOT NULL,
    -- 경보 대상 식별자 (IP 또는 user_id 문자열)
    target_key      VARCHAR(255) NOT NULL,
    -- 경보 발송 시점
    alerted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- 경보 메시지 요약
    summary         VARCHAR(1000) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_alert_type_target
    ON admin_access_alert_logs (alert_type, target_key, alerted_at DESC);
