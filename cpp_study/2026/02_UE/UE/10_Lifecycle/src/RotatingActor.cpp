#include "RotatingActor.h"
#include <iostream>

RotatingActor::RotatingActor()
    : rotation(0.0f),
    rotationSpeed(90.0f)
{
}

void RotatingActor::beginPlay()
{
    std::cout << "RotatingActor BeginPlay" << std::endl;
}

void RotatingActor::tick(float deltaTime)
{
    rotation += rotationSpeed * deltaTime;

    std::cout
        << "RotatingActor Tick, rotation = "
        << rotation
        << std::endl;
}

void RotatingActor::endPlay()
{
    std::cout << "RotatingActor EndPlay" << std::endl;
}