#include "Network/Server.h"

#include "Core/Logger.h"
#include "Core/Config.h"
#include "Core/Constant.h"

#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>

#include <cstring>

void Server::start()
{
    // 创建socket
    int serverFd = socket(AF_INET, SOCK_STREAM, 0);
    if (serverFd < 0)
    {
        Logger::error("socket create failed");
        return;
    }

    sockaddr_in address{};
    // ipv4
    address.sin_family = AF_INET;

    // 端口
    address.sin_port = htons(Config::port);

    // 本机地址
    address.sin_addr.s_addr = INADDR_ANY;

    // 绑定地址
    bind(serverFd, (sockaddr *)&address, sizeof(address));

    // 最大监听数量
    listen(serverFd, Constant::MAX_CLIENT);

    Logger::info("Server Start....");

    // 等待客户端连接

    int clinetFd = accept(serverFd, nullptr, nullptr);
    Logger::info("Client Connected");

    char buffer[Constant::BUFFER_SIZE] = {0};

    recv(clinetFd, buffer, sizeof(buffer), 0);

    Logger::info("receive:" + std::string(buffer));

    close(clinetFd);

    close(serverFd);
}