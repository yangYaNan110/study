#include "Weapon.h"
#include "Player.h"
int main()
{
 //   Player player;
	//player.attack();

 //   Weapon sword(50);
 //   Weapon gun(100);

 //   player.equipWeapon(&sword);
	//player.attack();

	//player.equipWeapon(&gun);
 //   player.attack();

	//Player player;
	//{
	//	Weapon sword(50);
	//	player.equipWeapon(&sword);

	//	player.attack();
	//}

	//sword 到这里已经销毁了 下面这行代码可能会导致程序崩溃，因为 player.weapon 指针指向了一个已经被销毁的对象


	//player.attack();

	Player player;
	Weapon sword(50);

	player.equipWeapon(&sword);
	player.attack();

	player.unequipWeapon();
	player.attack();


    return 0;
}