CREATE TABLE IF NOT EXISTS company_products (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    company_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    purchased_at DATETIME NULL,
    expires_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_company_products_company FOREIGN KEY (company_id)
        REFERENCES companies (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_company_products_product FOREIGN KEY (product_id)
        REFERENCES products (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uq_company_product (company_id , product_id),
    INDEX idx_company_products_company (company_id),
    INDEX idx_company_products_product (product_id),
    INDEX idx_company_products_status (status),
    INDEX idx_company_products_expires (expires_at)
)  ENGINE=INNODB;