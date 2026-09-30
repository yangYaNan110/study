import type { CreateUserData, User } from "./user.type.js";

class UserModel {
  private users: User[] = [
    {
      id: 1,
      name: "Tom",
      age: 20,
    },
    {
      id: 2,
      name: "Jack",
      age: 25,
    },
  ];

  findAll(): User[] {
    return this.users;
  }

  findById(id: number): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  create(data: CreateUserData): User {
    const user: User = {
      id: Date.now(),
      name: data.name,
      age: data.age,
    };

    this.users.push(user);

    return user;
  }
}

export const userModel = new UserModel();
