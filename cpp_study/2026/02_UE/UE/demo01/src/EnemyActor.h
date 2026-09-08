#pragma once
#include "Actor.h"

class EnemyActor :public Actor
{
public:
	void printInfo() override;
	void enemyAttack();
};