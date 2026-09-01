# UE 前置 C++ 练习计划

## 目标

在正式开始 Unreal Engine C++ 学习前，通过一组小练习，把 UE 中最常见、最容易遇到的 C++ 写法提前练熟。

目标不是系统学完整个 C++，而是：

- 能看懂 UE 常见 C++ 代码
- 能自己写简单的类和模块
- 能理解 Actor / Component / 生命周期等基础结构
- 进入 UE 后把注意力放在 UE 本身，而不是被 C++ 语法卡住

---

## 第一阶段：C++ 多态与对象基础

### 练习 1：继承 + `virtual` + `override`

#### 练习内容

创建一个基类：

```cpp
Actor
```

再创建：

```cpp
PlayerActor
EnemyActor
```

让它们继承 `Actor`。

练习：

- 类继承
- `public` 继承
- `virtual`
- `override`
- 基类指针指向派生类对象
- 运行时多态

#### 目标

以后看到 UE：

```cpp
class AMyActor : public AActor
{
};
```

以及：

```cpp
virtual void BeginPlay() override;
```

能够直接理解。

---

### 练习 2：构造函数 + 继承生命周期

#### 练习内容

给：

```cpp
Actor
PlayerActor
```

分别添加：

- 构造函数
- 析构函数

通过控制台打印观察：

```text
基类构造
派生类构造

派生类析构
基类析构
```

#### 需要理解

- 基类和派生类构造顺序
- 基类和派生类析构顺序
- 对象生命周期
- 成员初始化列表

#### 目标

为 UE 后续理解：

```text
Constructor
OnConstruction
BeginPlay
Tick
EndPlay
```

打基础。

---

### 练习 3：虚析构函数

#### 练习内容

创建：

```cpp
Actor* actor = new PlayerActor();
```

然后：

```cpp
delete actor;
```

分别测试：

```cpp
~Actor()
```

和：

```cpp
virtual ~Actor()
```

的区别。

#### 需要理解

- 为什么多态基类经常需要虚析构函数
- 为什么通过基类指针删除派生类对象时要特别注意析构

#### 目标

理解大型 C++ 继承体系里的资源释放问题。

---

### 练习 4：指针作为成员变量

#### 练习内容

设计：

```text
Player
└─ Weapon*
```

让 Player 可以：

- 持有 Weapon
- 判断 `nullptr`
- 使用 Weapon
- 切换 Weapon

#### 需要理解

- 指针成员变量
- `nullptr`
- 指针指向对象
- 对象生命周期
- 悬空指针基本概念
- 所有权基本概念

#### 目标

适应 UE 中大量出现的：

```cpp
AActor*
UObject*
UActorComponent*
```

---

# 第二阶段：UE 常见数据与语法

## 练习 5：`struct` + Vector3

#### 练习内容

自己写：

```cpp
struct Vector3
{
    float x;
    float y;
    float z;
};
```

再增加：

- 构造函数
- 两个 Vector3 相加
- 打印坐标
- 简单距离或长度计算

#### 需要理解

- `struct`
- 成员变量
- 成员函数
- `struct` 和 `class` 的基本区别

#### 目标

为 UE 里的：

```cpp
FVector
FRotator
FTransform
FHitResult
```

做准备。

---

## 练习 6：`enum class` + 简单状态机

#### 练习内容

定义：

```cpp
enum class ActorState
{
    Idle,
    Running,
    Jumping,
    Dead
};
```

给 Actor 保存当前状态。

根据状态执行不同逻辑。

#### 需要理解

- `enum`
- `enum class`
- 状态切换
- `switch`

#### 目标

适应 UE 中大量状态枚举，以及后续：

```cpp
UENUM()
```

---

## 练习 7：模板最小练习

#### 练习内容

只写一个非常简单的模板：

```cpp
template<typename T>
class Box
{
};
```

分别使用：

```cpp
Box<int>
Box<std::string>
Box<Vector3>
```

#### 不需要深入

暂时不学：

- 模板元编程
- SFINAE
- concepts 深层用法
- allocator

#### 目标

以后看到：

```cpp
TArray<AActor*>
TMap<FString, int32>
TSubclassOf<AActor>
TSharedPtr<Foo>
```

知道 `<...>` 是模板参数，不会觉得陌生。

---

## 练习 8：类型转换 + 多态判断

#### 练习内容

创建：

```text
Actor
├─ PlayerActor
└─ EnemyActor
```

使用基类指针保存不同派生类对象。

练习：

```cpp
static_cast
dynamic_cast
```

并判断对象的实际类型。

#### 目标

为 UE 后续：

```cpp
Cast<AMyActor>(Object)
```

打基础。

---

# 第三阶段：提前模拟 UE 架构

## 练习 9：简单 Actor + Component 系统

#### 练习内容

设计：

```text
Actor
├─ TransformComponent
└─ HealthComponent
```

Actor 持有多个组件。

组件各自负责自己的行为。

例如：

```text
TransformComponent
→ position
→ rotation

HealthComponent
→ health
→ damage()
```

#### 需要理解

- 对象组合
- Actor 与 Component 的职责分离
- 指针 / 引用
- 模块拆分
- 生命周期关系

#### 目标

直接为 UE：

```text
AActor
UActorComponent
USceneComponent
```

做准备。

---

## 练习 10：模拟 UE 生命周期

#### 练习内容

给 Actor 设计：

```cpp
beginPlay();
tick(float deltaTime);
endPlay();
```

然后自己写一个简单主循环：

```text
创建 Actor
↓
BeginPlay
↓
循环 Tick
↓
EndPlay
↓
销毁
```

#### 需要理解

- 生命周期函数
- 每帧更新
- DeltaTime
- 对象初始化与销毁

#### 目标

以后理解 UE：

```cpp
BeginPlay()
Tick(float DeltaTime)
EndPlay(...)
```

会非常自然。

---

## 练习 11：宏的基础认识

#### 练习内容

只学习最基础的：

```cpp
#define
#ifdef
#ifndef
#endif
```

例如：

```cpp
#define DEBUG_MODE
```

以及：

```cpp
#ifdef DEBUG_MODE
...
#endif
```

#### 不需要深入

暂时不自己写复杂宏系统。

#### 目标

以后看到：

```cpp
UCLASS()
UPROPERTY()
UFUNCTION()
GENERATED_BODY()
```

至少知道它们和普通函数调用不是一回事，而属于 UE 的宏、反射和代码生成体系。

---

# 第四阶段：综合练习

## 练习 12：极简 Actor World

这是进入 UE 前最后一个综合练习。

### 项目设计

```text
World
├─ PlayerActor
├─ EnemyActor
└─ RotatingActor
```

### 基础能力

每个 Actor 支持：

```cpp
beginPlay();
tick(float deltaTime);
endPlay();
```

### 使用的知识

综合使用：

- 类继承
- `virtual`
- `override`
- 多态
- 构造 / 析构
- 指针
- `nullptr`
- `struct`
- `enum class`
- 简单模板使用
- 类型转换
- Actor + Component
- 生命周期
- 模块化 `.h / .cpp`

### 推荐组件

```text
Actor
├─ TransformComponent
└─ HealthComponent
```

其中 `RotatingActor` 可以在：

```cpp
tick(float deltaTime)
```

中持续修改旋转。

### 目标

让整个程序已经有一点 UE 的感觉：

```text
World
↓
管理 Actor
↓
Actor 挂 Component
↓
BeginPlay
↓
每帧 Tick
↓
EndPlay
```

这个练习完成后，正式进入 Unreal Engine。

---

# 学习顺序

## 第一阶段：多态基础

```text
1. 继承 + virtual + override
2. 构造 / 析构与继承生命周期
3. 虚析构函数
4. 指针作为成员变量
```

## 第二阶段：UE 常见语法

```text
5. struct + Vector3
6. enum class + 状态机
7. 模板最小练习
8. 类型转换
```

## 第三阶段：UE 架构预演

```text
9. Actor + Component
10. BeginPlay / Tick / EndPlay
11. 宏基础
```

## 第四阶段：综合

```text
12. 极简 Actor World
```

---

# 优先级

如果时间有限，最重要的是：

```text
练习 1：继承 / virtual / override
练习 4：指针成员
练习 5：struct
练习 6：enum class
练习 9：Actor + Component
练习 10：生命周期
练习 12：综合 Actor World
```

---

# 暂时不用提前深入的内容

进入 UE 前不需要专门花大量时间学习：

```text
复杂模板元编程
STL 底层实现
手写 allocator
复杂多线程
复杂 move / forwarding
CMake 深度配置
复杂宏技巧
```

这些内容以后遇到真实需求时再补。

---

# 完成标准

每个练习不追求代码量。

建议标准：

```text
能自己写
↓
能运行
↓
能解释为什么
↓
能稍微改需求
```

确认理解后，再进入下一个练习。

最终完成练习 12 后，开始正式学习 Unreal Engine C++。
