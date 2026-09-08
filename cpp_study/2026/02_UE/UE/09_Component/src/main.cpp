//#include "Component.h"
#include "TransformComponent.h"
#include "HealthComponent.h"
#include "Actor.h"
int main()
{
    //Component component;

    //component.printInfo();





    //TransformComponent transform;

    //transform.setPosition(10.0f, 20.0f, 30.0f);

    //transform.printInfo();

    //HealthComponent health;

    //health.printInfo();

    //health.damage(30);
    //health.printInfo();

	Actor actor;
	TransformComponent transform;
	HealthComponent health;

	//transform.setPosition(10.0f, 20.0f, 30.0f);
	//health.damage(30);  

	actor.addComponent(&transform);
	actor.addComponent(&health);


	HealthComponent* headlthComponent = actor.getComponent<HealthComponent>();
	if (headlthComponent != nullptr)
	{
		headlthComponent->damage(30);
	}
	TransformComponent* transformComponent = actor.getComponent<TransformComponent>();
	if (transformComponent != nullptr)
	{
		transformComponent->setPosition(10.0f, 20.0f, 30.0f);
	}

	actor.printComponents();
    return 0;
}