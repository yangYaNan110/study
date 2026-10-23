import type { User } from "./user.type.js";

class UserModel {
  private users: User[] = [
    {
      id: 1,
      username: "admin",
      password: "123456",
      role: "admin",
    },
    {
      id: 2,
      username: "tom",
      password: "123456",
      role: "user",
    },
  ];

  findAll(): User[] {
    return this.users;
  }

  findById(id: number): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  findByUsername(username: string): User | undefined {
    return this.users.find((user) => user.username === username);
  }
}

export const userModel = new UserModel();
