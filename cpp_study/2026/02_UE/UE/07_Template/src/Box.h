#pragma once

template<typename T>
class Box
{
public:
	Box(T value)
		:value(value) {
	}

	T getValue() const
	{
		return value;
	}

private:
	T value;


};