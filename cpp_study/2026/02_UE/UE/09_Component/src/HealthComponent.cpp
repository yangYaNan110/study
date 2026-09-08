#include "HealthComponent.h"
#include <iostream>

HealthComponent::HealthComponent()
    : health(100)
{
}

void HealthComponent::damage(int value)
{
    health -= value;

    if (health < 0)
    {
        health = 0;
    }
}

void HealthComponent::printInfo() const
{
    std::cout
        << "Health: "
        << health
        << std::endl;
}