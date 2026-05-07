/*
================================================================================
MySQL 多表查询完全指南
================================================================================
核心概念：
- 外键约束：建立表之间的关系
- 笛卡尔积：两表所有可能的组合
- JOIN：连接查询的各种方式
================================================================================
 */
-- ============================================================================
-- 第一部分：表之间的关系类型
-- ============================================================================
-- 1.1 一对多关系（One-to-Many）
-- 例如：一个部门有多个员工
-- 特点：在"多"的那一方添加外键指向"一"的那一方
-- 创建部门表（一）
CREATE TABLE
    IF NOT EXISTS departments (
        dept_id INT PRIMARY KEY AUTO_INCREMENT,
        dept_name VARCHAR(50) NOT NULL UNIQUE,
        location VARCHAR(50)
    );

-- 创建员工表（多）- 通过dept_id外键关联
CREATE TABLE
    IF NOT EXISTS employees (
        emp_id INT PRIMARY KEY AUTO_INCREMENT,
        emp_name VARCHAR(50) NOT NULL,
        salary DECIMAL(10, 2),
        dept_id INT,
        FOREIGN KEY (dept_id) REFERENCES departments (dept_id)
    );

-- 1.2 多对多关系（Many-to-Many）
-- 例如：一个学生选修多个课程，一个课程被多个学生选修
-- 特点：需要创建中间表（关联表）来维护关系
CREATE TABLE
    IF NOT EXISTS students (
        student_id INT PRIMARY KEY AUTO_INCREMENT,
        student_name VARCHAR(50) NOT NULL
    );

CREATE TABLE
    IF NOT EXISTS courses (
        course_id INT PRIMARY KEY AUTO_INCREMENT,
        course_name VARCHAR(50) NOT NULL,
        credits INT
    );

-- 中间表：维护学生和课程的对应关系
CREATE TABLE
    IF NOT EXISTS enrollments (
        enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        grade CHAR(2),
        FOREIGN KEY (student_id) REFERENCES students (student_id),
        FOREIGN KEY (course_id) REFERENCES courses (course_id)
    );

-- 1.3 一对一关系（One-to-One）
-- 例如：一个用户只有一份详细资料
-- 特点：在从表中添加唯一外键
CREATE TABLE
    IF NOT EXISTS users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE
    );

CREATE TABLE
    IF NOT EXISTS user_profiles (
        profile_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNIQUE, -- 唯一外键，保证一对一
        bio TEXT,
        avatar_url VARCHAR(200),
        FOREIGN KEY (user_id) REFERENCES users (user_id)
    );

-- ============================================================================
-- 第二部分：JOIN查询详解
-- ============================================================================
-- 插入测试数据
INSERT INTO
    departments (dept_name, location)
VALUES
    ('销售部', '北京'),
    ('技术部', '上海'),
    ('HR部', '北京');

INSERT INTO
    employees (emp_name, salary, dept_id)
VALUES
    ('张三', 5000, 1),
    ('李四', 6000, 2),
    ('王五', 7000, 2),
    ('赵六', 5500, 1),
    ('孙七', 5200, NULL);

-- 没有分配部门
-- ============================================================================
-- 2.1 INNER JOIN（内连接）- 只返回匹配的行
-- ============================================================================
-- 语法：SELECT ... FROM 表1 INNER JOIN 表2 ON 连接条件
-- 特点：只有两个表中都存在的数据才会被返回
-- 查询所有员工及其部门信息
SELECT
    e.emp_id,
    e.emp_name,
    e.salary,
    d.dept_name,
    d.location
FROM
    employees e
    INNER JOIN departments d ON e.dept_id = d.dept_id;

-- 简写：可以省略INNER关键字
SELECT
    e.emp_name,
    d.dept_name
FROM
    employees e
    JOIN departments d ON e.dept_id = d.dept_id;

-- ============================================================================
-- 2.2 LEFT JOIN（左连接）- 返回左表的所有行 + 右表的匹配行
-- ============================================================================
-- 语法：SELECT ... FROM 表1 LEFT JOIN 表2 ON 连接条件
-- 特点：左表的所有数据都会被返回，右表没有匹配时为NULL
-- 查询所有员工及其部门（即使员工没有分配部门也显示）
SELECT
    e.emp_id,
    e.emp_name,
    e.salary,
    d.dept_name
FROM
    employees e
    LEFT JOIN departments d ON e.dept_id = d.dept_id;

-- 使用LEFT JOIN找出没有分配部门的员工
SELECT
    e.emp_name,
    d.dept_name
FROM
    employees e
    LEFT JOIN departments d ON e.dept_id = d.dept_id
WHERE
    d.dept_id IS NULL;

-- ============================================================================
-- 2.3 RIGHT JOIN（右连接）- 返回右表的所有行 + 左表的匹配行
-- ============================================================================
-- 语法：SELECT ... FROM 表1 RIGHT JOIN 表2 ON 连接条件
-- 特点：右表的所有数据都会被返回，左表没有匹配时为NULL
-- 查询所有部门及其员工（即使部门没有员工也显示）
SELECT
    d.dept_name,
    e.emp_name,
    e.salary
FROM
    employees e
    RIGHT JOIN departments d ON e.dept_id = d.dept_id;

-- ============================================================================
-- 2.4 FULL OUTER JOIN（全外连接）- 返回两个表中的所有行
-- ============================================================================
-- 语法：SELECT ... FROM 表1 FULL OUTER JOIN 表2 ON 连接条件
-- 注意：MySQL不直接支持FULL OUTER JOIN，需要用UNION模拟
-- 特点：两个表中的所有数据都会被返回，没有匹配的地方为NULL
-- MySQL中模拟FULL OUTER JOIN = LEFT JOIN UNION RIGHT JOIN
SELECT
    e.emp_id,
    e.emp_name,
    d.dept_name
FROM
    employees e
    LEFT JOIN departments d ON e.dept_id = d.dept_id
UNION
SELECT
    e.emp_id,
    e.emp_name,
    d.dept_name
FROM
    employees e
    RIGHT JOIN departments d ON e.dept_id = d.dept_id;

-- ============================================================================
-- 2.5 CROSS JOIN（交叉连接）- 笛卡尔积
-- ============================================================================
-- 语法：SELECT ... FROM 表1 CROSS JOIN 表2
-- 特点：返回两个表所有行的组合，结果数 = 表1行数 × 表2行数
-- 用途：用于生成组合数据
-- 示例：每个部门和每个员工的所有组合（没有实际意义，仅作演示）
SELECT
    d.dept_name,
    e.emp_name
FROM
    departments d
    CROSS JOIN employees e
ORDER BY
    d.dept_id,
    e.emp_id;

-- ============================================================================
-- 第三部分：多表查询的其他方式
-- ============================================================================
-- 3.1 使用子查询
-- 查询销售部的所有员工
SELECT
    *
FROM
    employees
WHERE
    dept_id = (
        SELECT
            dept_id
        FROM
            departments
        WHERE
            dept_name = '销售部'
    );

-- 查询工资高于平均工资的员工及其部门
SELECT
    e.emp_name,
    e.salary,
    d.dept_name
FROM
    employees e
    JOIN departments d ON e.dept_id = d.dept_id
WHERE
    e.salary > (
        SELECT
            AVG(salary)
        FROM
            employees
    );

-- 3.2 自连接 - 同一个表与自己连接
-- 例如：表中有manager_id字段指向本表的emp_id
-- 创建含有上级关系的员工表示例
ALTER TABLE employees
ADD COLUMN manager_id INT;

UPDATE employees
SET
    manager_id = 1
WHERE
    emp_id > 1;

-- 查询每个员工及其上级
SELECT
    e.emp_name AS 员工名,
    m.emp_name AS 上级名
FROM
    employees e
    LEFT JOIN employees m ON e.manager_id = m.emp_id;

-- ============================================================================
-- 第四部分：聚合函数与分组在多表中的应用
-- ============================================================================
-- 查询每个部门的员工人数和平均工资
SELECT
    d.dept_name,
    COUNT(e.emp_id) AS 员工数,
    AVG(e.salary) AS 平均工资
FROM
    departments d
    LEFT JOIN employees e ON d.dept_id = e.dept_id
GROUP BY
    d.dept_id,
    d.dept_name;

-- 查询只有超过2个员工的部门
SELECT
    d.dept_name,
    COUNT(e.emp_id) AS 员工数
FROM
    departments d
    LEFT JOIN employees e ON d.dept_id = e.dept_id
GROUP BY
    d.dept_id,
    d.dept_name
HAVING
    COUNT(e.emp_id) > 1;

-- ============================================================================
-- 第五部分：多表查询的常见陷阱和最佳实践
-- ============================================================================
/*
常见陷阱：
1. 忘记ON条件 - 会产生笛卡尔积（所有行的组合）
2. 使用了错误的JOIN类型 - 导致数据丢失
3. 在GROUP BY中遗漏非聚合列 - 某些数据库会报错
4. 外键关系不清晰 - 导致查询逻辑错误

最佳实践：
1. 使用表别名简化代码 (e for employees, d for departments)
2. 总是明确指定列所属的表 (e.emp_name 而不是 emp_name)
3. 使用INNER JOIN找精确匹配，LEFT JOIN包含所有左表数据
4. 性能：建立适当的索引，JOIN的列通常是外键和主键
5. 复杂查询：先确保理解所有表的关系，画出ER图会很有帮助
 */
-- ============================================================================
-- 第六部分：综合练习
-- ============================================================================
-- 练习1：找出工资最高的部门及其员工
SELECT
    d.dept_name,
    e.emp_name,
    e.salary
FROM
    employees e
    JOIN departments d ON e.dept_id = d.dept_id
WHERE
    e.salary = (
        SELECT
            MAX(salary)
        FROM
            employees
    );

-- 练习2：查询每个部门工资最高的员工
SELECT
    d.dept_name,
    e.emp_name,
    e.salary
FROM
    employees e
    JOIN departments d ON e.dept_id = d.dept_id
WHERE
    e.salary = (
        SELECT
            MAX(salary)
        FROM
            employees
        WHERE
            dept_id = d.dept_id
    );

-- 练习3：使用子查询分页显示员工信息（每页2条）
SELECT
    *
FROM
    employees
LIMIT
    2
OFFSET
    0;

-- 第1页
-- LIMIT 2 OFFSET 2;  -- 第2页
-- 练习4：多个JOIN示例 - 如果有选课表，显示选择IT课程的学生姓名
-- 示例（需要先插入数据）：
INSERT INTO
    students (student_name)
VALUES
    ('张三'),
    ('李四');

INSERT INTO
    courses (course_name, credits)
VALUES
    ('IT基础', 3),
    ('数据库', 3);

INSERT INTO
    enrollments (student_id, course_id, grade)
VALUES
    (1, 1, 'A'),
    (2, 2, 'B');

SELECT
    s.student_name,
    c.course_name,
    e.grade
FROM
    enrollments e
    JOIN students s ON e.student_id = s.student_id
    JOIN courses c ON e.course_id = c.course_id;