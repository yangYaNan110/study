#!/bin/bash
echo "当前工作目录:"
pwd
echo "======================"

echo "当前目录文件:"
ls
echo "====================="



echo "👀 开始监控..."
echo "💾 保存时自动编译"
echo "按 Ctrl+C 停止"
echo ""

# 初始化 build
if [ ! -d "build" ]; then
    echo "🏗️  创建 build 目录..."
    cmake -B build
fi

# 首次编译
echo "🔧 首次编译..."
cmake --build build && ./build/myapp
echo ""

# 记录文件修改时间
get_mtime() {
    find . -name "*.cpp" -o -name "*.h" | xargs stat -c %Y 2>/dev/null | md5sum
}

last_mtime=$(get_mtime)
echo "👀 开始监控文件变化..."

# 轮询检测（每秒检查）
while true; do
    sleep 0.5  # 每0.5秒检查一次
    
    current_mtime=$(get_mtime)
    
    if [ "$current_mtime" != "$last_mtime" ]; then
        echo ""
        echo "========================================"
        echo "📝 文件变化，重新编译..."
        echo ""
        
        cmake --build build
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ 编译成功！运行程序："
            echo "----------------------------------------"
            ./build/myapp
            echo "----------------------------------------"
        else
            echo "❌ 编译失败"
        fi
        
        echo ""
        echo "👀 继续监控..."
        
        # 更新记录
        last_mtime=$(get_mtime)
    fi
done