CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    company_id BIGINT UNSIGNED NULL,
    system_role_id BIGINT UNSIGNED NULL,
    role_name VARCHAR(100) NULL,
    role_code VARCHAR(100) NULL,

    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    password_hash VARCHAR(255) NOT NULL,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE',
        'SUSPENDED',
        'PENDING'
    ) NOT NULL DEFAULT 'PENDING',

    email_verified_at DATETIME NULL,

    last_login_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_users_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_users_system_role
        FOREIGN KEY (system_role_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_phone (phone),

    INDEX idx_users_company (company_id),
    INDEX idx_users_status (status),
    INDEX idx_users_system_role (system_role_id),
    INDEX idx_users_role_name (role_name),
    INDEX idx_users_role_code (role_code),

    INDEX idx_users_company_status (
        company_id,
        status
    )
) ENGINE=InnoDB;