# TinyChat

一个基于 C++ 的插件化聊天室框架（学习型工程项目）

---

# 一、项目描述

TinyChat 是一个用于练习 C++ 工程化开发能力的聊天室框架项目。

该项目的重点不在“聊天功能本身”，而在于模拟真实后端/中间件项目的架构设计方式，包括：

- 模块化设计
- 插件化架构
- 事件驱动模型
- 状态管理（Store）
- Hook 逻辑复用
- 命令系统（Command Pattern）
- 基础 TCP 网络通信

目标是构建一个“可扩展、低耦合、易维护”的 C++ 应用框架。

---

# 二、核心设计思想

## 1. 单向数据流

系统遵循单向数据流模型：

```
输入（Input）
    ↓
事件（EventBus）
    ↓
状态（Store）
    ↓
视图（View）
    ↓
输出（Network / Console）
```

避免模块之间直接调用造成强耦合。

---

## 2. 插件驱动架构

系统功能通过插件扩展：

- 启用插件 → 功能生效
- 禁用插件 → 功能消失

插件系统用于实现：

- 日志模块
- 机器人回复
- 表情转换
- 敏感词过滤
- 扩展业务逻辑

类似：

- VSCode 插件系统
- Chrome 插件系统
- Unity Package

---

## 3. Store 状态集中管理

系统中所有状态集中管理在 Store 层：

- ChatStore：聊天数据
- SessionStore：用户会话数据

特点：

- 数据统一管理
- 避免跨模块直接修改状态
- 支持响应式更新（配合 EventBus）

---

## 4. EventBus 事件驱动

模块之间通过事件通信：

- 发送消息 → MessageEvent
- 用户登录 → LoginEvent
- 用户退出 → LogoutEvent

特点：

- 解耦模块之间依赖
- 支持扩展事件类型
- 插件可订阅事件

---

## 5. Hook 逻辑封装

将复杂逻辑组合封装为 Hook：

- UseSocket
- UseChatRoom
- UsePlugin
- UseSubscribe

特点：

- 复用复杂逻辑组合
- 隐藏底层实现细节
- 提供高层接口

---

# 三、整体架构

```
                ┌──────────────┐
                │   View层     │
                │ ChatView     │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │   Hooks层    │
                │ UseChatRoom  │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │   Store层    │
                │ ChatStore    │
                │ SessionStore │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │ EventBus     │
                └──────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   Plugin系统      Network层     Command系统
```

---

# 四、目录结构

```
TinyChat/
│
├── CMakeLists.txt
├── README.md
│
├── config/
│   └── plugins.json
│
├── docs/
│   ├── architecture.md
│   └── plugin_system.md
│
├── include/
│
│   ├── Core/
│   │   ├── Application.h
│   │   ├── Config.h
│   │   ├── Constant.h
│   │   ├── Logger.h
│   │   └── ModuleManager.h
│   │
│   ├── Event/
│   │   ├── Event.h
│   │   └── EventBus.h
│   │
│   ├── Store/
│   │   ├── ChatStore.h
│   │   └── SessionStore.h
│   │
│   ├── Plugin/
│   │   ├── IPlugin.h
│   │   └── PluginManager.h
│   │
│   ├── Hooks/
│   │   ├── UseSocket.h
│   │   ├── UseChatRoom.h
│   │   └── UsePlugin.h
│   │
│   ├── Network/
│   │   ├── Server.h
│   │   └── Client.h
│   │
│   ├── Chat/
│   │   └── Message.h
│   │
│   ├── View/
│   │   └── ChatView.h
│   │
│   ├── Command/
│   │   ├── ICommand.h
│   │   └── CommandManager.h
│   │
│   └── Utils/
│       ├── StringUtil.h
│       └── TimeUtil.h
│
├── plugins/
│   ├── LoggerPlugin/
│   ├── RobotPlugin/
│   └── EmojiPlugin/
│
├── src/
│   ├── Core/
│   ├── Event/
│   ├── Store/
│   ├── Plugin/
│   ├── Hooks/
│   ├── Network/
│   ├── View/
│   ├── Command/
│   └── main.cpp
│
├── data/
│   └── logs/
│
└── test/
```

---

# 五、模块职责说明

## 1. Core（核心层）

提供基础能力支持：

- 日志系统
- 配置系统
- 常量定义
- 生命周期管理（ModuleManager）

特点：不包含任何业务逻辑

---

## 2. Event（事件系统）

负责系统内通信：

- 发布事件（emit）
- 订阅事件（subscribe）

用于解耦模块之间的直接调用关系。

---

## 3. Store（状态管理）

集中管理系统状态：

- ChatStore：聊天消息
- SessionStore：用户会话

特点：

- 单一数据源
- 状态统一更新
- 可观察变化

---

## 4. Plugin（插件系统）

负责功能扩展：

- 动态加载功能模块
- 通过事件订阅工作
- 不修改核心代码即可扩展能力

---

## 5. Hooks（逻辑封装层）

用于封装复杂组合逻辑：

- socket连接逻辑
- chat流程封装
- 插件使用封装

特点：

- 复用逻辑
- 隐藏实现细节
- 提供高层 API

---

## 6. Network（网络层）

负责 TCP 通信：

- socket连接
- 数据收发
- 客户端/服务端管理

不参与业务逻辑处理

---

## 7. View（表现层）

负责控制台 UI：

- 输入处理
- 消息展示
- 状态渲染

不直接操作 Store 或 Network

---

## 8. Command（命令系统）

处理用户指令：

```
/help
/users
/quit
```

特点：

- 命令解耦
- 易扩展
- 避免 if-else 臃肿

---

## 9. Utils（工具层）

提供通用工具函数：

- 字符串处理
- 时间处理
- 格式转换

不包含任何业务逻辑

---

# 六、项目目标

通过该项目可以掌握：

- C++ 工程目录设计
- 模块拆分方法
- 事件驱动架构
- 插件系统设计
- 状态管理模式
- 网络编程基础
- 可扩展系统设计思想

---

# 七、后续扩展方向

- epoll 高并发模型
- 线程池优化
- 动态库插件加载（dll/so）
- WebSocket 支持
- GUI 客户端（ImGui / Qt）
- 数据持久化（SQLite）
- RPC通信结构

```

```

```bash
mkdir build

cd build

cmake ..

cmake --build .

```
