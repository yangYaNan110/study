#include "Weapon.h"
#include <iostream>

Weapon::Weapon(int damage)
    : damage(damage)
{
}

void Weapon::attack() const
{
    std::cout << "Weapon attack, damage = "
        << damage
        << std::endl;
}