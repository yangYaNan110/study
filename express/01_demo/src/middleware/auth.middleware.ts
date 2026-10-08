import jwt from "jsonwebtoken";

import type { Request, Response, NextFunction } from "express";

import { env } from "../config/env.js";

import { AppError } from "../utils/app-error.js";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return next(new AppError(401, "未登录"));
  }

  const [type, token] = authorization.split(" ");

  if (type !== "Bearer" || !token) {
    return next(new AppError(401, "Token 格式错误"));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    (req as any).user = payload;

    next();
  } catch {
    next(new AppError(401, "Token 无效或已过期"));
  }
}
