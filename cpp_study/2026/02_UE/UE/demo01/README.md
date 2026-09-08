# 01_Inheritance

## 项目目的

这是 UE 前置 C++ 练习的第 1 个项目。

这个项目不追求功能复杂，而是专门练习 Unreal Engine 中最常见的一组 C++ 基础：

- 类继承
- 基类与派生类
- `public` 继承
- `virtual`
- `override`
- 基类指针指向派生类对象
- 运行时多态

完成这个项目后，希望能够自然看懂 UE 中常见的代码：

```cpp
class AMyActor : public AActor
{
};
```

以及：

```cpp
virtual void BeginPlay() override;
virtual void Tick(float DeltaTime) override;
```

---

## 为什么先练这个

Unreal Engine 本身就是一个非常大的 C++ 类继承体系。

以后会经常看到：

```text
UObject
└─ AActor
   └─ ACharacter
      └─ AMyCharacter
```

或者：

```text
UActorComponent
└─ USceneComponent
   └─ UPrimitiveComponent
```

如果继承、虚函数、多态没有真正理解，进入 UE 后很容易变成：

```text
代码能照着写
但是不知道为什么这样写
```

所以这个项目先把最核心的继承关系练熟。

---

# 项目最终准备做什么

我们会自己模拟一个非常小的 Actor 继承体系。

最终大致结构：

```text
Actor
├─ PlayerActor
└─ EnemyActor
```

---

## Actor

`Actor` 作为基类。

它代表一个最基础的“场景对象”。

后面准备给它设计一些行为，例如：

```cpp
virtual void beginPlay();
virtual void update();
virtual void printInfo();
```

这里暂时不是模仿 UE 的完整 Actor，只是借 Actor 这个名字练习 C++ 继承和多态。

---

## PlayerActor

`PlayerActor` 继承自：

```cpp
Actor
```

例如：

```cpp
class PlayerActor : public Actor
{
};
```

它会覆写基类的一部分行为。

例如：

```cpp
void update() override;
```

---

## EnemyActor

`EnemyActor` 同样继承：

```cpp
Actor
```

但是它会有自己的行为实现。

这样最终就可以做到：

```text
Actor*
  ↓
既可以指向 PlayerActor
也可以指向 EnemyActor
```

然后通过同一个基类接口执行不同的行为。

这就是我们这个项目最重要的目标：

> 多态。

---

# 最终希望看到的效果

例如我们以后可能会写：

```cpp
Actor* actor1 = new PlayerActor();
Actor* actor2 = new EnemyActor();

actor1->update();
actor2->update();
```

虽然：

```cpp
actor1
actor2
```

都是：

```cpp
Actor*
```

但是实际执行的却分别是：

```text
PlayerActor::update()
EnemyActor::update()
```

这就是运行时多态。

---

# 本项目学习步骤

整个项目不会一次写完。

我们会一步一步完成。

## Step 1：创建最简单的 Actor

先创建：

```text
Actor.h
Actor.cpp
```

理解：

```cpp
class Actor
```

到底是什么。

---

## Step 2：创建 PlayerActor

创建：

```text
PlayerActor.h
PlayerActor.cpp
```

让：

```cpp
PlayerActor
```

继承：

```cpp
Actor
```

第一次真正练习：

```cpp
class PlayerActor : public Actor
```

---

## Step 3：创建 EnemyActor

再创建：

```text
EnemyActor.h
EnemyActor.cpp
```

形成：

```text
Actor
├─ PlayerActor
└─ EnemyActor
```

---

## Step 4：普通成员函数与 `virtual` 的区别

先不使用 `virtual`。

观察：

```cpp
Actor* actor = new PlayerActor();
```

调用函数时到底执行谁。

通过实际运行理解：

> 为什么普通成员函数和虚函数行为不同。

---

## Step 5：加入 `virtual`

给基类成员函数加：

```cpp
virtual
```

重新运行。

观察行为变化。

重点理解：

```text
编译期看到的是 Actor*
运行时真正的对象却可能是 PlayerActor
```

---

## Step 6：加入 `override`

派生类使用：

```cpp
void update() override;
```

理解：

`override` 不是让函数拥有多态。

真正让多态成立的是基类的：

```cpp
virtual
```

而 `override` 主要帮助编译器检查：

> 这个函数是不是真的覆写了基类虚函数。

---

## Step 7：使用多个 Actor

最终在：

```cpp
main.cpp
```

中创建多个对象：

```text
PlayerActor
EnemyActor
PlayerActor
EnemyActor
```

统一通过：

```cpp
Actor*
```

调用。

体会为什么大型引擎喜欢通过共同基类管理大量不同对象。

---

# 预计项目目录

最终大致会形成：

```text
01_Inheritance/
├─ main.cpp
├─ Actor.h
├─ Actor.cpp
├─ PlayerActor.h
├─ PlayerActor.cpp
├─ EnemyActor.h
├─ EnemyActor.cpp
└─ README.md
```

当前第一个练习优先保证概念清晰，不急着增加目录复杂度。

---

# 本项目必须真正理解的问题

完成项目时，要能够自己回答：

1. 什么是继承？
2. 什么是基类和派生类？
3. `public Actor` 中的 `public` 是什么？
4. `virtual` 到底解决什么问题？
5. `override` 有什么作用？
6. 什么是运行时多态？
7. 为什么可以用 `Actor*` 指向 `PlayerActor`？

---

# 与 UE 的关系

这个项目完成以后，再看到：

```cpp
class AMyActor : public AActor
```

应该能够直接理解成：

```text
AMyActor
继承
AActor
```

再看到：

```cpp
virtual void BeginPlay() override;
```

应该能够理解：

```text
AActor 原本定义了一套 BeginPlay 接口
↓
AMyActor 对这套行为进行了自己的实现
↓
通过基类接口也可以调用到派生类实现
```

---

# 后续 UE 前置练习规划

当前解决方案后面准备逐步加入：

```text
UE
├─ 01_Inheritance
├─ 02_ConstructorLifecycle
├─ 03_VirtualDestructor
├─ 04_PointerMember
├─ 05_StructVector3
├─ 06_EnumState
├─ 07_Template
├─ 08_Cast
├─ 09_Component
├─ 10_Lifecycle
├─ 11_Macro
└─ 12_ActorWorld
```

## 02_ConstructorLifecycle

练习：

- 构造函数
- 析构函数
- 基类与派生类构造顺序
- 基类与派生类析构顺序
- 成员初始化列表

## 03_VirtualDestructor

练习：

```cpp
Actor* actor = new PlayerActor();
delete actor;
```

理解为什么多态基类通常需要：

```cpp
virtual ~Actor();
```

## 04_PointerMember

模拟：

```text
Player
└─ Weapon*
```

练习指针成员、`nullptr`、生命周期和所有权基础。

## 05_StructVector3

实现简单：

```cpp
struct Vector3
```

为 `FVector / FRotator / FTransform` 做准备。

## 06_EnumState

实现：

```cpp
enum class ActorState
{
    Idle,
    Running,
    Jumping,
    Dead
};
```

## 07_Template

只做最简单模板练习，目标是以后能自然看懂：

```cpp
TArray<AActor*>
TMap<FString, int32>
TSubclassOf<AActor>
```

## 08_Cast

练习：

- `static_cast`
- `dynamic_cast`
- 基类 / 派生类转换

为 UE 的 `Cast<AMyActor>()` 做准备。

## 09_Component

实现：

```text
Actor
├─ TransformComponent
└─ HealthComponent
```

提前理解 UE 的 Actor + Component 思路。

## 10_Lifecycle

模拟：

```cpp
beginPlay();
tick(float deltaTime);
endPlay();
```

为 UE 的 `BeginPlay / Tick / EndPlay` 做准备。

## 11_Macro

了解：

```cpp
#define
#ifdef
#ifndef
```

为 UE 中的：

```cpp
UCLASS()
UPROPERTY()
UFUNCTION()
GENERATED_BODY()
```

建立基础概念。

## 12_ActorWorld

最后综合实现：

```text
World
├─ PlayerActor
├─ EnemyActor
└─ RotatingActor
```

综合使用继承、多态、组件、生命周期、枚举、结构体和指针。

完成后正式开始 Unreal Engine C++ 学习。

---

# 当前学习原则

每个 Demo 都按照：

```text
先理解目标
↓
自己动手写
↓
编译运行
↓
观察结果
↓
解释为什么
↓
再进入下一步
```

不追求一次写很多代码。

目标是：

> 每一个知识点都真正理解，而不是只把代码跑起来。
