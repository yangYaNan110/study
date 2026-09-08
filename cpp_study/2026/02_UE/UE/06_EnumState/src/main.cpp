//#include "ActorState.h"
#include "Actor.h"
#include <windows.h>
int main() {
	SetConsoleOutputCP(CP_UTF8);
	//ActorState state = ActorState::Idle;

	Actor actor;
	actor.update();

	actor.setState(ActorState::Running);
	actor.update();

	

	actor.setState(ActorState::Dead);
	actor.update();
	actor.setState(ActorState::Jumping);
	actor.update();
	return 0;
}