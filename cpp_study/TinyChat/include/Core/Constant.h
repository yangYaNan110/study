#pragma once

/**
 * 项目全局常量
 *
 * 放：
 *  默认端口
 *  buffer大小
 *  最大连接数
 *
 * 不放：
 *  动态变化配置
 *
 *
 */

namespace Constant
{
    // 默认服务端端口
    constexpr int DEFAULT_PORT = 8080;

    // socket 读取buffer大小
    constexpr int BUFFER_SIZE = 1024;

    // 最大客户端数量
    constexpr int MAX_CLIENT = 10;
}