# 方案一：stdin/stdout + JSON

## 📋 项目概述

这是最简单的 IPC (进程间通信) 方案：

- Node.js 通过 `child_process.spawn()` 启动 C++ 程序
- Node.js 通过 stdin 发送 JSON 格式的请求
- C++ 通过 stdout 返回 JSON 格式的响应
- 使用 nlohmann/json 库处理 JSON

## 🎯 优缺点

| 方面       | 优点                    | 缺点                         |
| ---------- | ----------------------- | ---------------------------- |
| **性能**   | ✅ 足够快 (~10MB/s)     | ❌ 不适合超大文件            |
| **复杂度** | ✅ 非常简单             | ❌ 需要自己实现请求/响应匹配 |
| **调试**   | ✅ 易于调试 (JSON 可读) | ❌ 序列化/反序列化有开销     |
| **跨平台** | ✅ 完全跨平台           | -                            |
| **内存**   | ✅ 两个独立进程，隔离   | ❌ 不适合共享大数据          |

## 📁 项目结构

```
01_ipc_demo/
├── cpp/
│   ├── worker.cpp          # C++ 子进程
│   └── worker              # 编译后的可执行文件（运行后生成）
├── node/
│   └── app.js              # Node.js 主进程
├── package.json            # 项目配置
└── README.md               # 本文件
```

## 🚀 快速开始

### 1️⃣ 编译 C++ 代码

```bash
npm run build
```

这会执行：

```bash
g++ -std=c++17 -o cpp/worker cpp/worker.cpp
```

**注意：** 需要安装 nlohmann/json 库。

#### macOS 安装依赖：

```bash
brew install nlohmann-json
```

#### Linux 安装依赖：

```bash
# Ubuntu/Debian
sudo apt-get install nlohmann-json3-dev

# CentOS/RHEL
sudo yum install nlohmann-json-devel
```

#### Windows 安装依赖：

```bash
# 使用 vcpkg
vcpkg install nlohmann-json
```

### 2️⃣ 运行程序

```bash
npm start
```

### 3️⃣ 预期输出

```
🚀 启动 C++ 子进程...
✅ C++ 子进程已启动

--- 测试1: 计算数组的和 ---
请求: sum([1, 2, 3, 4, 5])
结果: 15

--- 测试2: 计算平均值 ---
请求: average([10, 20, 30, 40])
结果: 25

--- 测试3: 计算标准差 ---
请求: stddev([1, 2, 3, 4, 5])
结果: 1.4142135623730951

--- 测试4: 获取统计信息 ---
请求: stats([2, 4, 6, 8, 10])
结果: {
  "sum": 30,
  "average": 6,
  "stddev": 2.8284271247461903,
  "count": 5,
  "status": "success"
}

--- 测试5: 错误处理 ---
捕获到错误: Unknown operation: invalid_op

🛑 关闭子进程...
✅ 子进程已关闭
```

## 🔍 工作原理详解

### C++ 子进程 (worker.cpp)

```cpp
while (std::getline(std::cin, line)) {
    // 1. 读取一行 JSON
    json input = json::parse(line);

    // 2. 处理请求
    std::string operation = input["operation"];
    std::vector<double> data = input["data"];

    // 3. 执行计算
    double result = calculateSum(data);

    // 4. 输出结果 (JSON)
    std::cout << json{{"result", result}}.dump() << std::endl;
}
```

**核心特点：**

- 每行输入必须是完整的 JSON
- 每行输出必须是完整的 JSON
- 使用 `std::endl` 确保及时输出

### Node.js 主进程 (app.js)

```javascript
// 1. 启动子进程
const child = spawn("./cpp/worker");

// 2. 监听 stdout 数据
child.stdout.on("data", (data) => {
  const result = JSON.parse(data.toString());
  // 处理结果
});

// 3. 发送请求
child.stdin.write(
  JSON.stringify({
    operation: "sum",
    data: [1, 2, 3],
  }) + "\n",
);
```

**关键技术点：**

- `spawn()` 创建子进程（流式通信）
- 每个请求需要 `requestId` 来匹配响应
- 使用 Map 存储待处理请求的回调

## 💡 通信流程序列图

```
Node.js                        C++
  │                            │
  ├─ spawn('worker') ────────► 启动进程
  │                            │
  ├─ 发送 JSON ──────────────► stdin
  │  {"op":"sum","data":[...]} │
  │                            ├─ 读取 JSON
  │                            ├─ 解析请求
  │                            ├─ 执行计算
  │  stdout ◄───────────────── 输出 JSON
  │  {"result":15}             │
  │                            │
  ├─ 接收并解析                │
  ├─ 调用回调                  │
  │                            │
  ├─ 继续发送下一个请求 ─────► 处理
  │                            │
  ... (重复过程)              ...
  │                            │
  ├─ stdin.end() ────────────► 关闭 stdin
  │                            ├─ EOF 退出循环
  │                            └─ 进程退出
  └─ exit
```

## 📝 请求/响应格式

### 请求格式

```json
{
  "requestId": 1,
  "operation": "sum",
  "data": [1, 2, 3, 4, 5]
}
```

### 响应格式

**成功：**

```json
{
  "requestId": 1,
  "result": 15,
  "status": "success"
}
```

**错误：**

```json
{
  "requestId": 1,
  "error": "Unknown operation",
  "status": "error"
}
```

## 🧪 支持的操作

| 操作    | 输入  | 输出   | 说明             |
| ------- | ----- | ------ | ---------------- |
| sum     | int[] | number | 计算和           |
| average | int[] | number | 计算平均值       |
| stddev  | int[] | number | 计算标准差       |
| stats   | int[] | object | 返回所有统计数据 |

## 🛠️ 常见问题

### Q: 编译失败，提示找不到 nlohmann/json

**A:** 确保已安装依赖库，然后修改编译命令：

```bash
# macOS
g++ -std=c++17 -I/usr/local/include -o cpp/worker cpp/worker.cpp

# Linux (使用 pkg-config)
g++ -std=c++17 $(pkg-config --cflags nlohmann_json) -o cpp/worker cpp/worker.cpp
```

### Q: 运行时"找不到 worker"

**A:** 确保已编译 C++：

```bash
npm run build
```

### Q: "ENOENT: no such file or directory"

**A:** 检查路径是否正确，运行命令的工作目录是否在 `01_ipc_demo/`：

```bash
pwd  # 应该显示 .../node_cpp/01_ipc_demo
```

### Q: 子进程无法接收数据

**A:** 确保 JSON 每行以 `\n` 结尾，C++ 使用 `std::getline()` 而不是其他方式读取。

## 📚 下一步

掌握本方案后，你将学到：
✅ 子进程的启动和管理
✅ stdin/stdout 的数据通信
✅ JSON 序列化/反序列化
✅ 错误处理和异常捕获

**准备好了吗？** 在掌握这个方案后，会学第二个方案：**Unix Domain Socket + Protobuf** （更快、更高效）

## 🗑️ 清理

```bash
npm run clean
```

## 📖 扩展阅读

- [Node.js child_process 文档](https://nodejs.org/api/child_process.html)
- [nlohmann/json 文档](https://github.com/nlohmann/json)
- [进程间通信 (IPC)](https://en.wikipedia.org/wiki/Inter-process_communication)
