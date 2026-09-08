#include "Armor.h"
#include <iostream>

Armor::Armor(int defense) {
	std::cout << "Armor Constructor, defense=" << defense << std::endl;
}

Armor::~Armor() {
	std::cout << "Armor destructor" << std::endl;
}