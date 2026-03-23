-- =====================================
-- 课程01: 创建数据库和表
-- 文件名: 01_create_table.sql
-- 学习目标: 掌握DDL(数据定义语言)
-- =====================================
-- 1. 创建数据库和表
CREATE DATABASE IF NOT EXISTS practice_db CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;

USE practice_db;

DROP TABLE IF EXISTS users;

CREATE TABLE
    users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE,
        age INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) COMMENT = "用户表";

-- 验证 查看表结构
DESCRIBE users;