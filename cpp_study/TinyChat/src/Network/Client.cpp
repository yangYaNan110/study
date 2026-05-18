#include "Network/Client.h"

#include "Core/Logger.h"

#include "Core/Config.h"

#include <arpa/inet.h>

#include <unistd.h>

#include <cstring>

void Client::start()
{
    int clientFd = socket(AF_INET, SOCK_STREAM, 0);

    sockaddr_in serverAddress{};

    serverAddress.sin_family = AF_INET;

    serverAddress.sin_port = htons(Config::port);

    inet_pton(AF_INET, "127.0.0.1", &serverAddress.sin_addr);

    connect(clientFd, (sockaddr *)&serverAddress, sizeof(serverAddress));

    const char *msg = "hello tinyChat";

    send(clientFd, msg, strlen(msg), 0);

    Logger::info("message send");

    close(clientFd);
}
