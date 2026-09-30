import { AppError } from "../../utils/app-error.js";

import { userModel } from "./user.model.js";

class UserService {
  findAll() {
    return userModel.findAll();
  }

  findOne(id: number) {
    const user = userModel.findById(id);

    if (!user) {
      throw new AppError(404, "用户不存在");
    }

    return user;
  }

  findByUsername(username: string) {
    return userModel.findByUsername(username);
  }
}

export const userService = new UserService();
