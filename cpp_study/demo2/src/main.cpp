#include <iostream>
#include "math/Math.h"

using namespace mymath;
int main()
{
    int a = 30;
    int b = 20;

    std::cout << "a + b = " << add(a, b) << std::endl;
    std::cout << "a - b = " << sub(a, b) << std::endl;
    std::cout << "a * b = " << mul(a, b) << std::endl;

    return 0;
}