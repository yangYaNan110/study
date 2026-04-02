#pragma once
#include <string>
using namespace std;
class Person
{
private:
    string name;
    int age;

public:
    Person();
    Person(const string &name, int age);
    void setName(const string &newName);
    void setAge(int newAge);

    string getName() const;
    int getAge() const;

    void printInfo() const;
};