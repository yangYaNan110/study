#include "Actor.h"
#include "PlayerActor.h"

int  main() {

	Actor* actor = new PlayerActor();

	delete actor;
	return 0;
}