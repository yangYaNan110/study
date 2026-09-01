# TodoApp

一个用于学习 C++ 项目结构和模块化开发的小型命令行任务管理器。

项目本身保持简单，重点不是功能，而是通过这个项目理解：

* C++ 项目的基本目录结构
* `.h` 与 `.cpp` 的职责
* `#include`
* `class`
* `std::vector`
* 模块之间的依赖关系
* 文件读写
* C++ 的编译与链接过程

---

## 项目功能

第一版只实现以下功能：

1. 添加任务
2. 查看任务列表
3. 标记任务完成
4. 退出程序

运行效果大概如下：

```text
==== Todo App ====

1. Add task
2. List tasks
3. Complete task
4. Exit

Please select: 1

Task name: Learn C++

Task added.
```

任务列表：

```text
1. [ ] Learn C++
2. [x] Learn Git
```

---

## 项目目录规划

```text
TodoApp/
├─ README.md
│
├─ docs/
│
└─ src/
   ├─ main.cpp
   │
   ├─ task/
   │  ├─ Task.h
   │  ├─ Task.cpp
   │  ├─ TaskManager.h
   │  └─ TaskManager.cpp
   │
   ├─ storage/
   │  ├─ TaskStorage.h
   │  └─ TaskStorage.cpp
   │
   └─ utils/
      ├─ Utils.h
      ├─ StringUtils.cpp
      └─ InputUtils.cpp
```

目录按照功能模块划分，而不是单独把所有 `.h` 放到 `include`、所有 `.cpp` 放到 `src`。

这样可以直接从目录看出项目有哪些模块。

---

## 模块设计

### task

任务相关的核心业务模块。

#### Task

表示一条任务。

计划包含：

```text
Task
├─ id
├─ title
└─ completed
```

主要负责描述“一个任务是什么”。

#### TaskManager

负责管理多个 `Task`。

计划提供：

```text
addTask()
completeTask()
getTasks()
```

大致关系：

```text
TaskManager
    │
    ├─ Task
    ├─ Task
    └─ Task
```

---

### storage

负责数据持久化。

第一版不使用数据库，只保存到普通文本文件：

```text
tasks.txt
```

例如：

```text
1|Learn C++|0
2|Learn Git|1
```

模块关系：

```text
TaskManager
    ↓
TaskStorage
    ↓
tasks.txt
```

业务模块不直接处理文件读写。

以后即使把存储方式改成：

```text
JSON
SQLite
MySQL
```

也尽量不影响 `task` 模块。

---

### utils

存放通用工具函数。

计划包含：

```text
utils/
├─ Utils.h
├─ StringUtils.cpp
└─ InputUtils.cpp
```

#### StringUtils

负责字符串相关工具，例如：

```text
字符串切割
去除首尾空格
```

#### InputUtils

负责控制台输入，例如：

```text
读取整数
处理错误输入
读取字符串
```

#### Utils.h

作为 `utils` 模块统一的对外接口。

其他模块可以：

```cpp
#include "utils/Utils.h"
```

而不需要关心工具函数具体实现在哪个 `.cpp` 中。

---

## main.cpp 的职责

`main.cpp` 只作为程序入口和模块组合层。

主要负责：

```text
程序启动
    ↓
显示菜单
    ↓
接收用户输入
    ↓
调用对应模块
```

尽量不把具体业务逻辑全部写进 `main.cpp`。

---

## 模块关系

```text
               main
                 │
        ┌────────┼────────┐
        ↓        ↓        ↓
      task     storage   utils
        │        │
        └────┬───┘
             ↓
          tasks.txt
```

---

## 开发计划

### 第一阶段

搭建项目目录。

```text
src/
├─ main.cpp
├─ task/
├─ storage/
└─ utils/
```

了解 Visual Studio 中：

```text
真实目录
VS 筛选器
项目文件
```

之间的区别。

### 第二阶段

实现 `Task`。

学习：

```text
class
成员变量
成员函数
.h
.cpp
```

### 第三阶段

实现 `TaskManager`。

学习：

```text
std::vector
对象管理
引用
const
```

### 第四阶段

让 `main.cpp` 调用 `TaskManager`。

先完成纯内存版本：

```text
添加任务
查看任务
完成任务
```

程序关闭后数据暂时丢失。

### 第五阶段

实现 `utils` 模块。

把输入处理、字符串处理从业务代码中拆出去。

### 第六阶段

实现 `storage` 模块。

学习 C++ 文件 IO：

```text
读取文件
写入文件
```

让程序重新启动后仍然能够读取之前保存的任务。

### 第七阶段

整理项目依赖。

重点理解：

```text
#include
头文件声明
.cpp 实现
编译
链接
.exe
```

最终理解整个 C++ 项目是如何从多个模块生成一个可执行程序的。

---

## 当前进度

* [x] Visual Studio 安装完成
* [x] C++ Hello World 编译运行成功
* [x] 找到生成的 `.exe`
* [x] 创建 README.md
* [ ] 创建项目目录
* [ ] 创建 Task 模块
* [ ] 创建 TaskManager
* [ ] 创建 utils 模块
* [ ] 创建 storage 模块
* [ ] 完成 TodoApp

## vs
Ctrl + F          当前文件查找
Ctrl + H          当前文件替换
Ctrl + Shift + F  全局查找
Ctrl + Shift + H  全局替换


## 继续研究
1. 栈对象、堆对象、生命周期 -学会了
2. 引用 & 和指针 * -学会了
3. const 到底约束什么 - 学会了
4. 构造函数 / 析构函数 -学会了
5. .h / .cpp 为什么要分开 -明白了
6. 编译单元到底是什么 -明白了
7. #include 本质上干了什么 -明白了
8. 声明、定义、重复定义 -明白了
9. 链接器到底在干什么 -明白了
10. namespace --学会了
11. Debug / Release --学会了
12. CMake 和 VS 工程文件 --明白了
13. 解决方案和项目文件 --明白了


## 环境
编辑器：VS / VS Code / CLion

构建描述：CMakeLists.txt

构建工具：CMake + Ninja/MSBuild 等

编译器：cl / gcc / clang

链接器：link / ld / lld


