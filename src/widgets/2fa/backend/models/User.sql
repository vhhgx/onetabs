-- 用户表 SQL Schema (MySQL/PostgreSQL)
-- 如果使用 SQL 数据库，可以使用此表结构

CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),

  -- 基本信息
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  role ENUM('user', 'admin') DEFAULT 'user',
  status ENUM('active', 'inactive', 'banned') DEFAULT 'active',

  -- 2FA 相关字段
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT, -- 加密后的密钥
  two_factor_secret_temp TEXT, -- 临时密钥
  backup_codes TEXT, -- JSON 字符串数组

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_email (email),
  INDEX idx_two_factor_enabled (two_factor_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加注释
COMMENT ON COLUMN users.two_factor_secret IS '加密后的 2FA 密钥';
COMMENT ON COLUMN users.two_factor_secret_temp IS '临时 2FA 密钥（启用过程中使用）';
COMMENT ON COLUMN users.backup_codes IS '备用验证码（哈希后的 JSON 数组）';
