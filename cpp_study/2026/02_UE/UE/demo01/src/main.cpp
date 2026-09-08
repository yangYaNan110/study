#include "Actor.h"
#include "PlayerActor.h"
#include "EnemyActor.h"

#include <vector>


int main() {
	//Actor actor;
	//actor.printInfo();

	PlayerActor player;
	EnemyActor enemy;


	//player.printInfo();
	//player.playerMove();

	//enemy.printInfo();
	//enemy.enemyAttack();

	//Actor* actor1 = &player;
	//Actor* actor2 = &enemy;

	//actor1->printInfo();
	//actor2->printInfo();

	//std::vector<Actor*> actors;

	//actors.push_back(&player);
	//actors.push_back(&enemy);



	//for (Actor* actor : actors)
	//{
	//	actor->printInfo();
	//}
	
	Actor* actor1 = &player;
	//虚函数决定“调用哪个实现”；指针类型决定“你能访问哪些成员”
	// 指针类型决定“能访问什么”；虚函数决定“最终调用哪个实现”
	// player.printInfo();
	//actor1->playerMove();

	return 0;
}