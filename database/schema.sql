-- Expense Tracker database schema (MySQL 8+)
-- Run from the project root in PowerShell:
--   mysql -u YOUR_USER -p -e "source database/schema.sql"

CREATE DATABASE IF NOT EXISTS expense_tracker_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE expense_tracker_db;

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100)  NOT NULL,
  email          VARCHAR(150)  NOT NULL UNIQUE,
  password       VARCHAR(255)  NOT NULL,              -- bcrypt hash, never plain text
  monthly_budget DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- optional feature (0 = no budget set)
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- categories ----------
CREATE TABLE IF NOT EXISTS categories (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT         NOT NULL,
  category_name VARCHAR(50) NOT NULL,
  created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- a user cannot have two categories with the same name
  UNIQUE KEY uq_user_category (user_id, category_name),
  CONSTRAINT fk_categories_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- expenses ----------
CREATE TABLE IF NOT EXISTS expenses (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT           NOT NULL,
  category_id  INT           NOT NULL,
  title        VARCHAR(150)  NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  expense_date DATE          NOT NULL,
  description  TEXT          NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, expense_date),
  INDEX idx_user_category (user_id, category_id),
  CONSTRAINT fk_expenses_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  -- RESTRICT: the database itself refuses to delete a category that still has expenses,
  -- so expenses can never be silently deleted.
  CONSTRAINT fk_expenses_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
