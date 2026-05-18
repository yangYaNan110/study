#include "Core/Logger.h"
#include "Core/Config.h"
#include "Core/Constant.h"

int main()
{
    Logger::info("TinyChat Start");

    Logger::info("Server Port:" + std::to_string(Config::port));
    return 0;
}