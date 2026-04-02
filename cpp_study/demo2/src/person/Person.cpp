#include "person/Person.h"
#include <iostream>
using namespace std;
Person::Person() : name(""), age(0) {}

Person::Person(const string &name, int age) : name(name), age(age) {}

void Person::setName(const string &newName)
{
    name = newName;
}

void Person::setAge(int newAge)
{
    age = newAge;
}

string Person::getName() const
{
    return name;
}

int Person::getAge() const
{
    return age;
}

void Person::printInfo() const
{
    cout << "name:" << name << ", age:" << age << endl;
}