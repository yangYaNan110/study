#pragma once

#include "Actor.h"
#include <iostream>

class PlayerActor : public Actor
{
public:
    void playerMove()
    {
        std::cout << "Player Move" << std::endl;
    }
};