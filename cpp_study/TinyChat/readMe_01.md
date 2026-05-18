# TinyChat

一个基于 C++ 的插件化聊天室框架（工程实践项目）

---

# 一、项目目标

本项目用于系统性练习 C++ 工程化开发能力，重点包括：

- 模块化设计
- Socket 网络编程
- 事件驱动架构（EventBus）
- 状态管理（Store）
- 插件系统（Plugin）
- Hook 逻辑封装
- 命令系统（Command）

最终目标是构建一个“可扩展的聊天框架”，而不是简单聊天室程序。

---

# 二、开发规划（重要）

本项目采用**阶段式开发 + 可验收机制**进行。

每一阶段完成后必须满足验收标准，并进行复盘。

---

# 🚀 阶段1：工程初始化（骨架搭建）

## 🎯目标

搭建完整 C++ 工程结构

## 内容

- CMake 项目可编译运行
- main.cpp 输出 Hello TinyChat
- 目录结构创建完成

## 验收标准

- [ ] cmake 能正常构建
- [ ] 程序可运行
- [ ] 输出日志："TinyChat Start"

## 复盘点

- CMake 基本结构
- include/src 分离是否合理

---

# 🚀 阶段2：Socket基础通信（单客户端）

## 🎯目标

实现 server + client 最基本通信

## 内容

- TCP Server
- TCP Client
- client发送消息，server能接收

## 验收标准

- [ ] client能连接server
- [ ] server能打印客户端消息
- [ ] 无崩溃

## 复盘点

- socket流程是否理解
- recv/send是否正确阻塞处理

---

# 🚀 阶段3：多客户端 + 广播

## 🎯目标

实现聊天室基础能力

## 内容

- 多客户端连接
- 消息广播给所有客户端
- client1发送 → client2/3收到

## 验收标准

- [ ] 支持≥2客户端
- [ ] 消息正确广播
- [ ] 不互相覆盖

## 复盘点

- 是否需要线程处理
- 是否出现数据竞争

---

# 🚀 阶段4：EventBus事件系统

## 🎯目标

解耦 server 和业务逻辑

## 内容

- EventBus实现
- MessageEvent / LoginEvent
- 插件可订阅事件

## 验收标准

- [ ] server不直接处理业务逻辑
- [ ] 通过事件分发消息
- [ ] 插件可以接收事件

## 复盘点

- 是否减少耦合
- 是否支持扩展事件

---

# 🚀 阶段5：Store状态管理

## 🎯目标

统一管理系统状态

## 内容

- ChatStore（消息）
- SessionStore（用户）
- 状态变化通知机制

## 验收标准

- [ ] 消息集中管理
- [ ] 用户状态可查询
- [ ] 状态变化可追踪

## 复盘点

- 是否出现全局变量
- 是否职责清晰

---

# 🚀 阶段6：Plugin插件系统

## 🎯目标

实现功能可插拔

## 内容

- IPlugin接口
- PluginManager
- LoggerPlugin / RobotPlugin

## 验收标准

- [ ] 插件可加载/卸载
- [ ] 不修改核心代码即可新增功能
- [ ] 插件能响应事件

## 复盘点

- 是否做到“核心稳定 + 功能扩展”
- 是否依赖混乱

---

# 🚀 阶段7：Hooks + Command系统整合

## 🎯目标

完成架构优化与封装

## 内容

- UseSocket Hook
- UseChatRoom Hook
- /help /users 命令系统
- 统一入口优化

## 验收标准

- [ ] ChatView不再写socket逻辑
- [ ] command可扩展
- [ ] hooks可复用

## 复盘点

- 是否业务与UI解耦
- 是否出现重复逻辑

---

# 三、整体架构设计

```
View
  ↓
Hooks
  ↓
Store
  ↓
EventBus
  ↓
Plugin
  ↓
Network
```

---

# 四、模块说明

## Core

基础能力（日志/配置/常量）

## Network

TCP通信层，不处理业务

## EventBus

事件驱动系统，用于模块通信

## Store

状态管理中心（类似 Redux）

## Plugin

功能扩展系统（可插拔能力）

## Hooks

逻辑组合封装（类似 React Hooks 思想）

## Command

用户命令系统（/help /quit）

## View

控制台交互层

---

# 五、项目原则

- 核心层不能依赖业务层
- 所有业务通过事件通信
- 状态必须通过 Store 修改
- 功能必须可插件化
- UI 不直接操作网络

---

# 六、后续升级方向

- epoll 高并发模型
- 线程池优化
- 动态库插件（dll/so）
- GUI客户端（ImGui / Qt）
- 数据持久化（SQLite）

````

---

# 📌 下一步我建议你这样做（非常重要）

不要继续设计了，直接开始：

## 👉 第一步（现在就做）

### 阶段1：工程初始化

你要做：

```text
1. 建CMake项目
2. 创建目录结构
3. main.cpp输出日志
````

---

# 如果你愿意，我可以继续“带你做下一步”

你下一条可以直接说：

👉 “开始阶段1，我现在建CMake”

我可以帮你：

- :contentReference[oaicite:0]{index=0}
- :contentReference[oaicite:1]{index=1}
- :contentReference[oaicite:2]{index=2}
- :contentReference[oaicite:3]{index=3}

我们可以按“真实带项目”的方式推进，而不是讲概念。

## https://chatgpt.com/c/6a0aac94-7658-83e8-a772-248f2e6f4799?promo_campaign=plus-2-months-50-pct-off#pricing
