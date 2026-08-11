CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    product_id BIGINT UNSIGNED NULL,

    name VARCHAR(150) NOT NULL,
    code VARCHAR(150) NOT NULL,

    description VARCHAR(255) NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_permissions_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY uq_permissions_product_code (
        product_id,
        code
    ),

    INDEX idx_permissions_product (
        product_id
    ),

    INDEX idx_permissions_status (
        status
    )
) ENGINE=InnoDB;