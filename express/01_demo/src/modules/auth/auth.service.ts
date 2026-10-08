import jwt from "jsonwebtoken";

import { userService } from "../user/user.service.js";

import { AppError } from "../../utils/app-error.js";
import { env } from "../../config/env.js";

class AuthService {
  login(username: string, password: string) {
    const user = userService.findByUsername(username);

    if (!user) {
      throw new AppError(401, "用户名或密码错误");
    }

    if (user.password !== password) {
      throw new AppError(401, "用户名或密码错误");
    }

    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
      },
      env.jwtSecret,
      {
        expiresIn: env.jwtExpiresIn as any,
      },
    );

    return {
      accessToken: token,
    };
  }
}

export const authService = new AuthService();
