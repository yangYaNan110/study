#pragma once
#include <vector>
/**
 * TCP 服务端
 * 职责：
 * 创建socket
 * 监听端口
 * 接受客户端
 * 接受消息
 * 注意：
 * 当前阶段：
 * 但客户端版本
 */
class Server
{
public:
    // 启动服务
    void start();

private:
    // 所有客户端连接
    std::vector<int> clients;

    // 客户端处理线程
    void handleClient(int clientFd);

    // 广播
    void broadcast(const char *msg, int sender);
};