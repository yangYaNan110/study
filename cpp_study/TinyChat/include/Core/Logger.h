#pragma once

#include <string>

/**
 * 日志系统
 * 后续可扩展
 * 输出时间
 * 输出文件
 * 输出线程ID
 *
 */

class Logger
{
public:
    static void info(const std::string &msg);

    static void error(const std::string &msg);
};
