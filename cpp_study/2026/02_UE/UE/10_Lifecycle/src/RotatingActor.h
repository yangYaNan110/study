#pragma once

#include "Actor.h"

class RotatingActor : public Actor
{
public:
    RotatingActor();

    void beginPlay() override;
    void tick(float deltaTime) override;
    void endPlay() override;

private:
    float rotation;
    float rotationSpeed;
};