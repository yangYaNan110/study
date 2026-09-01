#include "Task.h"
#include <iostream>

void Task::print() const
{
	std::cout
		<< id
		<< " - "
		<< title
		<< " - "
		<< completed
		<< std::endl;

}