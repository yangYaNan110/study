-- 课程2：插入数据(INSERT)
-- 学习目标: 掌握多种插入方式
USE practice_db;

-- [方式1] 插入完整记录（所有字段）
INSERT INTO
    users (
        id,
        username,
        email,
        age,
        is_active,
        create_at,
        update_at
    )
VALUES
    (
        1,
        "张三",
        "zhangsan@qq.com",
        25,
        TRUE,
        NOW (),
        NOW ()
    );

-- 方式2 插入指定字段(其他用默认值)
INSERT INTO
    users (username, email, age)
VALUES
    ("李四", "lisi@qq.com", 30);

-- 方式3 批量插入
INSERT INTO
    users (username, email, age, is_active)
VALUES
    ("王五", "wangwu@qq.com", 28, TRUE),
    ("赵六", "zhaoliu@qq.com", 35, FALSE),
    ("孙七", "sunqi@qq.com", 22, TRUE);

--方式4 插入时忽略(email有唯一约束)
INSERT IGNORE INTO users (username, email, age)
VALUES
    ("张三", "zhangsan@qq.com", 25);

--这条会忽略 因为email重复
--验证 查看所有数据
SELECT
    *
FROM
    users;