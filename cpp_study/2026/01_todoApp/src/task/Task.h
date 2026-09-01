#pragma once
#include <string>

class Task
{
public:
	int id;
	std::string title;
	bool completed;

	void print() const;
};