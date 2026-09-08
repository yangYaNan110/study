#pragma once

#include "Component.h"

class TransformComponent : public Component
{
public:
    TransformComponent();

    void setPosition(float x, float y, float z);
    void printInfo() const override;

private:
    float x;
    float y;
    float z;
};