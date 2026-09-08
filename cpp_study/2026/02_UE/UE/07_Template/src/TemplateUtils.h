#pragma once

template<typename T>
T maxValue(const T& a, const T& b)
{
    if (a > b)
    {
        return a;
    }

    return b;
}