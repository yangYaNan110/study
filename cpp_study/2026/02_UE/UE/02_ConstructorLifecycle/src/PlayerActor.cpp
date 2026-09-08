#include "PlayerActor.h"
#include <iostream>
//成员初始化顺序，不是看初始化列表里你怎么写，而是看成员在类里声明的顺序。
PlayerActor::PlayerActor()
	:health(100),
	speed(600.0f),
	armor(50),
	weapon(50)
{
	std::cout << "PlayerActor constructor" << std::endl;
	std::cout << "health = " << health << std::endl;
	std::cout << "speed = " << speed << std::endl;
}

PlayerActor::~PlayerActor()
{
	std::cout << "PlayerActor destructor" << std::endl;
}