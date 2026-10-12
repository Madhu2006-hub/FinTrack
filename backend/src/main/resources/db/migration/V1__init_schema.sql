CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(255)  NOT NULL,
    password_hash VARCHAR(100)  NOT NULL,
    created_at    DATETIME(6)   NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE transactions (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT         NOT NULL,
    title            VARCHAR(120)   NOT NULL,
    amount           DECIMAL(15,2)  NOT NULL,
    type             VARCHAR(10)    NOT NULL,
    category         VARCHAR(30)    NOT NULL,
    transaction_date DATE           NOT NULL,
    description      VARCHAR(500),
    created_at       DATETIME(6)    NOT NULL,
    updated_at       DATETIME(6)    NOT NULL,
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_transactions_amount CHECK (amount > 0),
    INDEX idx_transactions_user_date (user_id, transaction_date),
    INDEX idx_transactions_user_type_category (user_id, type, category)
);

CREATE TABLE budgets (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT        NOT NULL,
    category     VARCHAR(30)   NOT NULL,
    budget_month DATE          NOT NULL,
    amount       DECIMAL(15,2) NOT NULL,
    created_at   DATETIME(6)   NOT NULL,
    updated_at   DATETIME(6)   NOT NULL,
    CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_budgets_amount CHECK (amount > 0),
    CONSTRAINT uk_budgets_user_category_month UNIQUE (user_id, category, budget_month)
);
