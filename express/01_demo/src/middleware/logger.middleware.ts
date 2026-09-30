// 日志中间件
import type { Request, Response, NextFunction } from "express";

export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log(`[${new Date().toISOString()}]`, req.method, req.url);

  next();
}
