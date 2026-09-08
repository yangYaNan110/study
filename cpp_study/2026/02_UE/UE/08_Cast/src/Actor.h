#pragma once

class Actor
{
public:
    //原因是后面要用 dynamic_cast，基类需要是多态类型，也就是至少有一个虚函数
    virtual ~Actor() = default;
};