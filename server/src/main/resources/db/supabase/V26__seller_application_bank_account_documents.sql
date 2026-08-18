ALTER TABLE seller_applications
    ADD COLUMN IF NOT EXISTS bank_account_copy_object_key VARCHAR(500),
    ADD COLUMN IF NOT EXISTS bank_account_copy_content_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bank_account_copy_size_bytes BIGINT;
