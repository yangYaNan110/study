import type { ErrorRequestHandler } from "express";

import { AppError } from "../utils/app-error.js";

export const errorMiddleware: ErrorRequestHandler = (error, req, res, next) => {
  console.error(error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  res.status(500).json({
    success: false,
    message: "服务器内部错误",
  });
};
