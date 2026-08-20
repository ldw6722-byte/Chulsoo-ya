-- RLS and anon/authenticated privilege revocation were applied to all current public tables
-- through individually committed administrative DDL operations. This marker records that
-- production hardening in Flyway without re-running a long Session Pooler DDL batch.
SELECT 1;
