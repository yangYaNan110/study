#include "Actor.h"
#include <iostream>

void Actor::beginPlay()
{
    std::cout << "Actor BeginPlay" << std::endl;
}

void Actor::tick(float deltaTime)
{
    std::cout << "Actor Tick, deltaTime = "
        << deltaTime
        << std::endl;
}

void Actor::endPlay()
{
    std::cout << "Actor EndPlay" << std::endl;
}