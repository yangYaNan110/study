## 目录说明

```plain
project1/
├── src/          # 源文件 (.cpp)
├── include/      # 头文件 (.h)
├── build/        # 编译生成的中间文件（不提交到 git）
├── bin/          # 最终可执行文件
├── CMakeLists.txt
└── .gitignore
```

```bash
# 配置
cmake -B build

# 编译
cmake --build build

# 运行
./build/myapp
```
