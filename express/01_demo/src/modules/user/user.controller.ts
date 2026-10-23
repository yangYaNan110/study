import type { Request, Response } from "express";

import { userService } from "./user.service.js";
// Controller 的职责现在很清楚：
// 拿 HTTP 参数
// ↓
// 调用 Service
// ↓
// 返回 HTTP 响应
class UserController {
  findAll = (req: Request, res: Response) => {
    const users = userService.findAll();

    res.json({
      success: true,
      data: users,
    });
  };

  findOne = (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const user = userService.findOne(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  };

  create = (req: Request, res: Response) => {
    const { name, age } = req.body;

    const user = userService.create({
      name,
      age,
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  };
}

export const userController = new UserController();
