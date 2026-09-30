import { Router } from "express";

import { authController } from "./auth.controller.js";

import { asyncHandler } from "../../utils/async-handler.js";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(authController.login));
