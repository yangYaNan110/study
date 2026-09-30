import express from "express";

export const app = express();

import { userRouter } from "./modules/user/user.router.js";
import { loggerMiddleware } from "./middleware/logger.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

//注册解析json中间件
app.use(express.json());

//注册日志中间件
app.use(loggerMiddleware);

//注册用户路由
app.use("/users", userRouter);

app.get("/", (req, res) => {
  res.send("Hello, World!22");
});

// 注册错误中间件
app.use(errorMiddleware);
