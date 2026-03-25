cmake_minimum_required(VERSION 3.10)
project(demo1)

set(CMAKE_CXX_STANDARD 17)

# 告诉编译器去 src 目录找头文件
include_directories(src)

# 收集 src 目录下的所有 .cpp 文件
file(GLOB SOURCES "src/*.cpp")

# 加上 main.cpp（在项目根目录）
list(APPEND SOURCES main.cpp)

add_executable(myapp ${SOURCES})