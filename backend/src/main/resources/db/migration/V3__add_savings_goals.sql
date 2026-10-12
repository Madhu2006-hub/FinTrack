CREATE TABLE savings_goals (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT         NOT NULL,
    name           VARCHAR(120)   NOT NULL,
    target_amount  DECIMAL(15,2)  NOT NULL,
    current_amount DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
    target_date    DATE,
    notes          VARCHAR(500),
    created_at     DATETIME(6)    NOT NULL,
    updated_at     DATETIME(6)    NOT NULL,
    CONSTRAINT fk_savings_goals_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_savings_goals_target CHECK (target_amount > 0),
    CONSTRAINT chk_savings_goals_current CHECK (current_amount >= 0),
    INDEX idx_savings_goals_user (user_id)
);
