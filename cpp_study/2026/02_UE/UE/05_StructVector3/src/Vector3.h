#pragma once

struct Vector3
{
	float x;
	float y;
	float z;

	Vector3(float x, float y, float z);

	void print() const;

	Vector3 add(const Vector3& other) const;

	Vector3 operator+(const Vector3& other) const;

	float length() const;
};