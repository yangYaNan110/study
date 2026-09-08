#include "Actor.h"
#include <iostream>

Actor::Actor()
    : state(ActorState::Idle)
{
}

bool Actor::setState(ActorState newState)
{
	//如果当前状态是Dead，则不允许更改状态
    if (state == ActorState::Dead)
    {
        std::cout << "当前状态为Dead, 无法更改状态" << std::endl;
        return false;
    }


    state = newState;
    return true;
}

void Actor::update() const
{
    switch (state)
    {
    case ActorState::Idle:
        std::cout << "Idle" << std::endl;
        break;

    case ActorState::Running:
        std::cout << "Running" << std::endl;
        break;

    case ActorState::Jumping:
        std::cout << "Jumping" << std::endl;
        break;

    case ActorState::Dead:
        std::cout << "Dead" << std::endl;
        break;
    }
}