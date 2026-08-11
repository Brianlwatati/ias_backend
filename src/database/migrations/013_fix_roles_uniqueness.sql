
-- Add `role_scope_key` only if it doesn't already exist
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'roles'
        AND COLUMN_NAME = 'role_scope_key'
);

SET @s = IF(@col_exists = 0,
    'ALTER TABLE roles ADD COLUMN role_scope_key VARCHAR(200) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Populate `role_scope_key`
UPDATE roles
SET role_scope_key = CASE
        WHEN product_id IS NULL THEN 'SYSTEM'
        ELSE CONCAT('PRODUCT:', product_id)
END;

-- Ensure NOT NULL (only runs if column exists)
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'roles'
        AND COLUMN_NAME = 'role_scope_key'
);

SET @s = IF(@col_exists = 1,
    'ALTER TABLE roles MODIFY COLUMN role_scope_key VARCHAR(200) NOT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop old unique index if it exists
SET @idx_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'roles'
        AND INDEX_NAME = 'uq_roles_product_code'
);

SET @s = IF(@idx_exists > 0,
    'ALTER TABLE roles DROP INDEX uq_roles_product_code',
    'SELECT 1'
);
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add new unique index if missing
SET @idx_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'roles'
        AND INDEX_NAME = 'uq_roles_scope_code'
);

SET @s = IF(@idx_exists = 0,
    'ALTER TABLE roles ADD UNIQUE KEY uq_roles_scope_code (role_scope_key, code)',
    'SELECT 1'
);
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

