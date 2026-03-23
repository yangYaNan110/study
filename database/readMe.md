## 数据库学习

## MySQL 学习规划（SQL 重点）

### 阶段一：环境搭建（今天完成）

- 使用 Docker 部署 MySQL 8.0
- 用 VS Code 连接数据库
- 创建第一个数据库和表

### 阶段二：SQL 基础（第 1-3 天）

- DDL：创建/修改/删除表结构
- DML：增删改查（CRUD）
- DQL：基础查询、条件筛选、排序分页

### 阶段三：SQL 进阶（第 4-7 天）

- 多表查询：JOIN、子查询
- 聚合函数与分组统计
- 索引原理与优化基础

### 阶段四：实战与进阶（第 8-14 天）

- 事务与锁机制
- 存储过程与函数
- 性能优化与慢查询分析

### 第一步 在终端执行

```bash

# 1. 拉取 MySQL 8.0 镜像
docker pull mysql:8.0

# 2. 创建并启动容器
docker run -d \
  --name mysql-learning \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=testdb \
  -p 3306:3306 \
  mysql:8.0

# 3. 查看容器是否运行
docker ps

# 4. 进入 MySQL 容器内部
# 进入容器内部的 MySQL 命令行
docker exec -it mysql-learning mysql -u root -p
```
