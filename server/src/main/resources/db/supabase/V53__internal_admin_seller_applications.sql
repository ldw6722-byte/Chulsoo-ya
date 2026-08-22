ALTER TABLE seller_applications
    ADD COLUMN IF NOT EXISTS internal_admin_application BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE seller_applications
    ALTER COLUMN business_registration_number DROP NOT NULL,
    ALTER COLUMN city_name DROP NOT NULL,
    ALTER COLUMN district_name DROP NOT NULL,
    ALTER COLUMN gu_code DROP NOT NULL,
    ALTER COLUMN address DROP NOT NULL,
    ALTER COLUMN phone DROP NOT NULL;

COMMENT ON COLUMN seller_applications.internal_admin_application IS
    '최고관리자 또는 권한을 부여받은 일반관리자의 내부 판매자 기능 테스트 신청 여부';
