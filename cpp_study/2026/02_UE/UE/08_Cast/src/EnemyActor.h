#pragma once

#include "Actor.h"
#include <iostream>

class EnemyActor : public Actor
{
public:
    void enemyAttack()
    {
        std::cout << "Enemy Attack" << std::endl;
    }
};