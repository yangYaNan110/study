#pragma once

#include "Component.h"

class HealthComponent : public Component
{
public:
    HealthComponent();

    void damage(int value);
    void printInfo() const override;

private:
    int health;
};