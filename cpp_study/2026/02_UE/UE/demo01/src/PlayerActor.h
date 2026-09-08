#pragma once
#include "Actor.h"
//public 继承表示派生类公开地“是一个”基类类型。
class PlayerActor : public Actor {

public:
	void printInfo() override;
	void playerMove();
};