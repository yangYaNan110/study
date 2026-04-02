#include <iostream>
#include "math/Math.h"
#include "person/Person.h"

using namespace mymath;
// 测试类
void testPerson(); // 先声明

int main()
{
    int a = 30;
    int b = 20;

    std::cout << "a + b = " << add(a, b) << std::endl;
    std::cout << "a - b = " << sub(a, b) << std::endl;
    std::cout << "a * b = " << mul(a, b) << std::endl;

    testPerson();

    return 0;
}

void testPerson()
{
    Person p1;
    p1.setName("tom");
    p1.setAge(20);
    p1.printInfo();

    Person p2("jerry", 18);
    p2.printInfo();
}