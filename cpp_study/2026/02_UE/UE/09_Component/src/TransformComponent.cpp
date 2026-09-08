#include "TransformComponent.h"
#include <iostream>

TransformComponent::TransformComponent()
    : x(0.0f),
    y(0.0f),
    z(0.0f)
{
}

void TransformComponent::setPosition(float x, float y, float z)
{
    this->x = x;
    this->y = y;
    this->z = z;
}

void TransformComponent::printInfo() const
{
    std::cout
        << "Transform Position: "
        << x << ", "
        << y << ", "
        << z
        << std::endl;
}