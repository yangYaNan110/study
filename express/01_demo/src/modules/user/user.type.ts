export interface User {
  id: number;
  username: string;
  password: string;
  role: string;
}

export interface CreateUserData {
  name: string;
  age: number;
}
