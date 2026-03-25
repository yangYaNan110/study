#include "math.h"
#include <iostream>

int add(int a, int b) {
    return a + b;
}

void print_add(int a, int b) {
    std::cout << a << " + " << b << " = " << add(a, b) << std::endl;
}