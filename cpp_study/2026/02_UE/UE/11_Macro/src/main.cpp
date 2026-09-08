#include <iostream>

#define SAY_HELLO() std::cout << "Hello Macro!" << std::endl

int main()
{
    SAY_HELLO();

    return 0;
}