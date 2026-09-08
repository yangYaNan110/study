#include "Box.h"
#include <iostream>
#include <string>
#include "TemplateUtils.h"

int main() {
	Box<int> intBox(100);
	Box<std::string> stringBox("Hello");

	std::cout << intBox.getValue() << std::endl; // Output: 100
	std::cout << stringBox.getValue() << std::endl; // Output: Hello



	int a = 10;
	int b = 20;

	std::cout << maxValue(a, b) << std::endl; // Output: 20

	float x = 5.5f;
	float y = 3.3f;
	std::cout << maxValue(x, y) << std::endl; // Output: 5.5
	return 0;
}