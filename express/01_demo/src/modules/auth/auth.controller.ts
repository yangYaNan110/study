import type { Request, Response } from "express";

import { authService } from "./auth.service.js";

class AuthController {
  login = (req: Request, res: Response) => {
    const { username, password } = req.body;

    const result = authService.login(username, password);

    res.json({
      success: true,
      data: result,
    });
  };
}

export const authController = new AuthController();
