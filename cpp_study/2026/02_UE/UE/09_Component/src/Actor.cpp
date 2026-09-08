#include "Actor.h"

void Actor::addComponent(Component* component)
{
	components.push_back(component);
}

void Actor::printComponents() const
{
	for (Component*  component : components)
	{
		component->printInfo();
	}

}