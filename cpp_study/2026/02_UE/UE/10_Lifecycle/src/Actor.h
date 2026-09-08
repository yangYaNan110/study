#pragma once

class Actor
{
public:
	virtual ~Actor() = default;

	virtual void beginPlay();

	virtual void tick(float deltaTime);

	virtual void endPlay();

};