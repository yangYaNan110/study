#include "Vector3.h"
#include <iostream>

int main()
{
	//Vector3 position(10.0f, 20.0f, 30.0f);

	//std::cout << position.x << std::endl;
	//std::cout << position.y << std::endl;
	//std::cout << position.z << std::endl;

	//position.print();

	Vector3 a(10.0f, 20.0f, 30.0f);
	Vector3 b(1.0f, 2.0f, 3.0f);
	//Vector3 c = a.add(b);
	Vector3 c = a + b;
	c.print();


	Vector3 d(3.0f, 4.0f, 0.0f);
	std::cout << "Length of d: " << d.length() << std::endl;

	return 0;
}