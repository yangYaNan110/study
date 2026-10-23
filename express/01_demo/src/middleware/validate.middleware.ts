import type { Request, Response, NextFunction } from "express";
// 创建用户验证中间件
export function validateCreateUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { name, age } = req.body;

  if (typeof name !== "string") {
    return res.status(400).json({
      success: false,
      message: "name 必须是字符串",
    });
  }

  if (typeof age !== "number") {
    return res.status(400).json({
      success: false,
      message: "age 必须是数字",
    });
  }

  next();
}
