#include "Weapon.h"
class Player {
public:
	Player();
	void equipWeapon(Weapon* newWeapon);
	void attack() const;
	void unequipWeapon();

private:
	Weapon* weapon;
};