-- 查询所有数据库
SHOW DATABASES;

-- 查询当前数据库
SELECT
    DATABASE ();

USE sys;

USE testdb;

SHOW TABLES;

DESC study;

CREATE TABLE
    study (age INT COMMENT "年龄", name CHAR(100) COMMENT "年龄") COMMENT "学生表";

INSERT INTO
    study (name, age)
VALUES
    ("张三", 18),
    ("李四", 19),
    ("王五", 20);

SELECT
    *
FROM
    study;