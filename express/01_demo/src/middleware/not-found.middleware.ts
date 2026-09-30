import type { Request, Response, NextFunction } from "express";

import { AppError } from "../utils/app-error.js";

export function notFoundMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  next(new AppError(404, `接口不存在: ${req.method} ${req.originalUrl}`));
}
