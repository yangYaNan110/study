cmake_minimum_required(VERSION 3.15)

project(TinyChat)

set(CMAKE_CXX_STANDARD 17)

include_directories(include)

file(
    GLOB_RECURSE SRC
    src/*.cpp
)

add_executable(
    TinyChat
    ${SRC}
)