#include "Utils.h"

#include <iostream>
#include <limits>

int readInt()
{
	int value;
	std::cin >> value;

	std::cin.ignore(
		std::numeric_limits<std::streamsize>::max(),
		'\n'
	);
	return value;
}

std::string readLine()
{
	std::string value;
	std::getline(std::cin, value);

	return value;
}