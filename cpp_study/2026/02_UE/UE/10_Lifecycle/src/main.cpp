#include "Actor.h"
#include "RotatingActor.h"

int main()
{
    //Actor actor;

    //actor.beginPlay();

    //actor.tick(0.016f);
    //actor.tick(0.016f);
    //actor.tick(0.016f);

    //actor.endPlay();

    RotatingActor actor;
	actor.beginPlay();

    //actor.tick(0.016f);
    //actor.tick(0.016f);
    //actor.tick(0.016f);
	const float deltaTime = 0.016f; // Simulate 60 FPS
    for (int frame=0; frame<5; frame++)
    {
                actor.tick(deltaTime);
    }


    actor.endPlay();

    return 0;
}