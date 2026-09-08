#include "Weapon.h"
#include <iostream>

//Weapon::Weapon() {
//	std::cout << "Weapon constructor" << std::endl;
//}

Weapon::Weapon(int damage)
{
	std::cout << "Weapon Constructor, damage =" << damage << std::endl;
}

Weapon::~Weapon()
{
	std::cout << "Weapon destructor" << std::endl;
}

