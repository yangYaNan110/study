cmake_minimum_required(VERSION 3.15)

project(demo3-cpp11+)

set(CMAKE_CXX_STANDARD 17)

include_directories(include)

add_executable(
    demo3-cpp11+
    main.cpp
)