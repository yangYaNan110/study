import express from "express";

export const app = express();

import { userRouter } from "./modules/user/user.router.js";
import { loggerMiddleware } from "./middleware/logger.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { authRouter } from "./modules/auth/auth.router.js";

//注册解析json中间件
app.use(express.json());

//注册日志中间件
app.use(loggerMiddleware);

//注册鉴权中间件
app.use("/auth", authRouter);

//注册用户路由
app.use("/users", userRouter);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});
// 前面所有路由都没有匹配
// 就会走到这里
app.use(notFoundMiddleware);
// 注册错误中间件
app.use(errorMiddleware);
