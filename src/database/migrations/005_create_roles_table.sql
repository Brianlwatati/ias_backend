CREATE TABLE IF NOT EXISTS  roles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id BIGINT UNSIGNED NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    scope ENUM('SYSTEM', 'PRODUCT') NOT NULL,
    role_scope_key VARCHAR(200) NOT NULL,
    description VARCHAR(255) NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_roles_product FOREIGN KEY (product_id)
        REFERENCES products (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uq_roles_scope_code (role_scope_key , code),
    INDEX idx_roles_product (product_id),
    INDEX idx_roles_scope (scope),
    INDEX idx_roles_status (status)
)  ENGINE=INNODB;