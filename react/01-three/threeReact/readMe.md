## 根据自己目前的能力

- 准备结合threejs 写一个类似UE的库，可以通过react组件吧actor添加到场景中 并且通过添加组件来增强actor
- 通过composer = new EffectComposer(renderer);来控制渲染和后处理部分

- 每个actor是场景里的基本单元

- core/system下面放库的源码 都是class类或者function函数 用于实现库的核心功能和actor的实现
  - 每个actor有自己的数据结构设计 用于存储actor的属性和状态 最终吧自己能渲染的内容合并到渲染管理器中
  - 重点 比如地球actor 会用四叉树数据结构筛选瓦片 以及一些缓存调度各种策略 最后吧需要渲染的内容放到渲染管理器中渲染 不同的actor的数据结构设计是不同的
  - 再比如实例化actor 会按照实例化策略组织数据
  - 再比如组合actor 会吧数据组合起来 用于渲染
  - 再比如静态网格 actor 会按照普通的mesh组织数据 用于渲染
- core/actors 下面放的是系统对外默认提供的一些现成actor 用于快速搭建场景 -- 这个暂时不用管
- output下面放能被外面使用的react组件 用于实现库的组件化
