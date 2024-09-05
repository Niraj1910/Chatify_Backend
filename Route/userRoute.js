import { Router } from "express";
import {
  handlDecodeToken,
  handleLogoutUser,
  handlerGetAllUsers,
  handleSignIn,
  handleSignUp,
} from "../Controller/userController.js";

import { validateToken } from "../services/jwt.js";

const userRouter = Router();

userRouter.post("/sign-up", handleSignUp);
userRouter.post("/sign-in", handleSignIn);
userRouter.get("/sign-out", validateToken, handleLogoutUser);
userRouter.get("/users", validateToken, handlerGetAllUsers);
userRouter.get("/decode-token", validateToken, handlDecodeToken);

export { userRouter };
