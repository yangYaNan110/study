-- 课程3: 基础查询（DQL）
-- 学习目标: 掌握各种查询技巧
USE practice_db;

-- ==============================
-- 基础查询
-- ==============================
-- 1.查询所有字段(开发中避免 性能差)
SELECT * FROM users;

-- 2. 查询指定字段(推荐)
SELECT username, email FROM users;

-- 3. 给字段起别名（AS可省略）
SELECT username AS 用户名, email AS 邮箱 FROM users;

-- ===========================
-- 条件查询 where
-- ===========================
-- 4.精确匹配
SELECT * FROM users WHERE username = "张三";

-- 5. 模糊匹配
SELECT * FROM users WHERE username LIKE "%三%";

--6.多条件: AND(且)，OR（或）
SELECT * FROM users WHERE age > 25 AND is_active = TRUE;

--7. 范围查询
SELECT * FROM users WHERE age BETWEEN 20 AND 30;

--8. 集合查询
SELECT * FROM users WHERE username IN ("张三", "李四", "王五");

-- ===========================
-- 排序 ORDER BY
-- ===========================
-- 9. 升序（默认）
SELECT * FROM users ORDER BY age ASC;

-- 10.降序
SELECT * FROM users ORDER BY age DESC;

-- 11. 多字段排序
SELECT * FROM users ORDER BY is_active DESC, age ASC;

-- 12.限制条数(前两条)
SELECT * FROM users LIMIT 2;

-- 13.分页公式: LIMIT (页码-1)* 每页条数, 每页条数
-- 第2页，每页2条
SELECT * FROM users LIMIT 2, 2;

-- =====================
-- 去重与计算
-- =====================
-- 14 去重
SELECT DISTINCT is_active FROM users;

-- 15 统计总数
SELECT COUNT(*) AS 总人数 FROM users;

-- 16 统计最大 / 最小 / 平均年龄
SELECT MAX(age) AS 最大年龄, MIN(age) AS 最小年龄, AVG(age) AS 平均年龄
FROM users;