import { Router } from "express";

import { userController } from "./user.controller.js";
import { validateCreateUser } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const userRouter = Router();

userRouter.get("/", asyncHandler(userController.findAll));

userRouter.get("/:id", asyncHandler(userController.findOne));

userRouter.post("/", validateCreateUser, asyncHandler(userController.create));
