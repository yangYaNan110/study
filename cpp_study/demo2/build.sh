#!/bin/bash

echo "🔧 开始编译..."

# 如果没有 build 目录，先配置
if [ ! -d "build" ]; then
    echo "🏗️  首次配置 CMake..."
    cmake -B build
fi

# 编译
cmake --build build

# 检查是否成功
if [ $? -eq 0 ]; then
    echo "✅ 编译成功！"
    echo "🚀 运行程序："
    ./build/myapp
else
    echo "❌ 编译失败"
    exit 1
fi