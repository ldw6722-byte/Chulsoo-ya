ALTER TABLE seller_applications
    DROP CONSTRAINT IF EXISTS ck_seller_application_certificate_size;

ALTER TABLE seller_applications
    ADD CONSTRAINT ck_seller_application_certificate_size
    CHECK (certificate_size_bytes IS NULL OR certificate_size_bytes BETWEEN 102400 AND 10485760);

ALTER TABLE seller_applications
    ADD CONSTRAINT ck_seller_application_bank_account_copy_size
    CHECK (bank_account_copy_size_bytes IS NULL OR bank_account_copy_size_bytes BETWEEN 102400 AND 10485760);
