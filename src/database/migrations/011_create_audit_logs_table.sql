CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NULL,
    company_id BIGINT UNSIGNED NULL,

    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT UNSIGNED NULL,

    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,

    metadata JSON NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_audit_logs_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_audit_logs_user (
        user_id
    ),

    INDEX idx_audit_logs_company (
        company_id
    ),

    INDEX idx_audit_logs_action (
        action
    ),

    INDEX idx_audit_logs_entity (
        entity_type,
        entity_id
    ),

    INDEX idx_audit_logs_created (
        created_at
    )
) ENGINE=InnoDB;