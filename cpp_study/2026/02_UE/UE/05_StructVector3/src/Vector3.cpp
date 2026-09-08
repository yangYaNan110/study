#include "Vector3.h"
#include <iostream>

#include <cmath>
Vector3::Vector3(float x, float y, float z)
	:x(x), y(y), z(z)
{
}

void Vector3::print() const
{
	std::cout << "x=" << x
		<< ", y=" << y
		<< ", z=" << z
		<< std::endl;

}

Vector3 Vector3::add(const Vector3& other) const
{
	return Vector3(x + other.x, y + other.y, z + other.z);
}
Vector3 Vector3::operator+(const Vector3& other) const
{
	return Vector3(x + other.x, y + other.y, z + other.z);
}

float Vector3::length() const
{
	return std::sqrt(x * x + y * y + z * z);
}