#pragma once

class Weapon
{
public:
    Weapon(int damage);

    void attack() const;

private:
    int damage;
};