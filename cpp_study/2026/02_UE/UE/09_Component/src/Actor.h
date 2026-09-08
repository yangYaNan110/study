#pragma once

#include <vector>
#include "Component.h"

class Actor
{
public:
	void addComponent(Component* component);
	void printComponents() const;

	template<typename T>
	T* getComponent() const
	{
		for (Component* component : components)
		{
			T* result = dynamic_cast<T*>(component);
			if (result != nullptr) {
				return result;
			}
		}
		return nullptr;
	}

private:
	std::vector<Component*> components;
};