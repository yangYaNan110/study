#include "Player.h"
#include <iostream>

Player::Player()
	:weapon(nullptr)
{
}

void Player::equipWeapon(Weapon* newWeapon)
{
	weapon = newWeapon;
}

void Player::attack() const {
	if (weapon == nullptr)
	{
		std::cout << "Player has no weapon" << std::endl;
		return;
	}
	weapon->attack();
}

void Player::unequipWeapon()
{
	weapon = nullptr;
}