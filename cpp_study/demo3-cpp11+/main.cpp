#include <iostream>
#include <vector>
#include <typeinfo>
using namespace std;
struct Point
{
    int x;
    int y;
};

int main()
{
    // Point p = {1, 2};
    // cout << "hello world!!" << endl;

    // vector<int> nums = {1, 2, 3, 4, 5};
    // auto it = nums.begin();
    // auto num = 10;

    // cout << "first element:" << *it << ", num:" << num << endl;

    // int x = 5;
    // decltype(x) y = 10; // decltype(x) 表示 y 的类型与 x 相同
    // cout << "x: " << x << ", y: " << y << endl;

    // decltype(x + 1.5) z;

    // cout << "y type:" << typeid(y).name() << ", z type:" << typeid(z).name() << endl;

    // vector<int> vec = {1, 2, 3, 4, 5};
    // for (auto &num : vec)
    // {
    //     num *= 2;
    // }
    // // 输出元素
    // for (const auto &num : vec)
    // {
    //     cout << num << " ";
    // }
    // cout << endl;

    return 0;
}