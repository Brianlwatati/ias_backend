CREATE TABLE transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    company_id BIGINT UNSIGNED NOT NULL,
    subscription_id BIGINT UNSIGNED NULL,
    transaction_reference VARCHAR(100) NOT NULL,
    transaction_type ENUM('PAYMENT', 'REFUND', 'CREDIT', 'DEBIT', 'ADJUSTMENT') NOT NULL,
    amount DECIMAL(15 , 2 ) NOT NULL,
    currency CHAR(3) NOT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50) NULL,
    external_transaction_id VARCHAR(255) NULL,
    transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_transactions_reference (transaction_reference),
    INDEX idx_transactions_company (company_id),
    INDEX idx_transactions_subscription (subscription_id),
    INDEX idx_transactions_status (status),
    INDEX idx_transactions_date (transaction_date),
    CONSTRAINT fk_transactions_company FOREIGN KEY (company_id)
        REFERENCES companies (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_transactions_subscription FOREIGN KEY (subscription_id)
        REFERENCES subscriptions (id)
        ON DELETE SET NULL ON UPDATE CASCADE
)  ENGINE=INNODB;