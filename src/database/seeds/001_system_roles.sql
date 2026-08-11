INSERT INTO roles (
    product_id,
    name,
    code,
    scope,
    description
)
SELECT
    NULL,
    'Super Administrator',
    'SUPER_ADMIN',
    'SYSTEM',
    'Full access to the authentication platform'
WHERE NOT EXISTS (
    SELECT 1
    FROM roles
    WHERE code = 'SUPER_ADMIN'
      AND scope = 'SYSTEM'
);

INSERT INTO roles (
    product_id,
    name,
    code,
    scope,
    description
)
SELECT
    NULL,
    'Company Administrator',
    'COMPANY_ADMIN',
    'SYSTEM',
    'Administrator of a company'
WHERE NOT EXISTS (
    SELECT 1
    FROM roles
    WHERE code = 'COMPANY_ADMIN'
      AND scope = 'SYSTEM'
);