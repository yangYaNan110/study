#pragma once

#include "ActorState.h"

class Actor
{
public:
    Actor();

    bool setState(ActorState newState);
    void printState() const;
    void update() const;

private:
    ActorState state;
};  