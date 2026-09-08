#include "Actor.h"
#include "PlayerActor.h"
#include "EnemyActor.h"

int main()
{
    PlayerActor player;

    Actor* actor = &player;

    PlayerActor* playerActor = dynamic_cast<PlayerActor*>(actor);
    if (playerActor != nullptr)
    {
        playerActor->playerMove();
    }

    EnemyActor enemy;

    Actor* actor1 = &enemy;

    PlayerActor* playerPtr =
        dynamic_cast<PlayerActor*>(actor1);
        //static_cast<PlayerActor*>(actor1);


    if (playerPtr == nullptr)
    {
        std::cout << "actor is not PlayerActor" << std::endl;
    }

    //dynamic_cast 成功
    //    → 返回目标类型指针

    //    dynamic_cast 失败
    //    → 返回 nullptr
    return 0;
}