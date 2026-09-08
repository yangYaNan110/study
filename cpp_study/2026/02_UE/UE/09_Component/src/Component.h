#pragma once

class Component
{
public:
	virtual ~Component() = default;
	virtual void printInfo() const;
};