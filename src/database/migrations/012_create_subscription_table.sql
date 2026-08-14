CREATE TABLE subscriptions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    company_id BIGINT UNSIGNED NOT NULL,
    company_product_id BIGINT UNSIGNED NOT NULL,
    status ENUM('PENDING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    amount DECIMAL(15 , 2 ) NOT NULL,
    currency CHAR(3) NOT NULL,
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NOT NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    payment_status ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERPAID') NOT NULL DEFAULT 'UNPAID',
    cancelled_at DATETIME NULL,
    cancellation_reason VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_subscriptions_company (company_id),
    INDEX idx_subscriptions_company_product (company_product_id),
    INDEX idx_subscriptions_status (status),
    INDEX idx_subscriptions_ends_at (ends_at),
    CONSTRAINT fk_subscriptions_company FOREIGN KEY (company_id)
        REFERENCES companies (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_subscriptions_company_product FOREIGN KEY (company_product_id)
        REFERENCES company_products (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
)  ENGINE=INNODB;