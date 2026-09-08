#pragma once
#include "Actor.h"
#include "Weapon.h"
#include "Armor.h"

class PlayerActor : public Actor
{
public:
	PlayerActor();
	~PlayerActor();

private:
	int health;
	float speed;
	Weapon weapon;
	Armor armor;
};