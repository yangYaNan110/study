#include "Utils.h"
#include <cctype>

std::string trim(const std::string& text)
{
	std::size_t start = 0;
	
	while (
		start < text.length() &&
		std::isspace(static_cast<unsigned char>(text[start]))
	)
	{
		start++;
	}

	std::size_t end = text.length();

	while (
		end > start &&
		std::isspace(static_cast<unsigned char>(text[end - 1]))
	)
	{
		end--;
	}

	return text.substr(start, end - start);
}