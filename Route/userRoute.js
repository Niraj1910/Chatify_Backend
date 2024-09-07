import { Router } from "express";
import {
  handlDecodeToken,
  handleLogoutUser,
  handlerGetAllUsers,
  handleSignIn,
  handleSignUp,
  handlUpdateUser,
} from "../Controller/userController.js";

import { validateToken } from "../services/jwt.js";

import { multerUpload } from "../Config/multer.js";

const userRouter = Router();

userRouter.post("/sign-up", multerUpload.single("avatar"), handleSignUp);
userRouter.post("/sign-in", handleSignIn);
userRouter.get("/sign-out", validateToken, handleLogoutUser);
userRouter.get("/users", validateToken, handlerGetAllUsers);
userRouter.get("/decode-token", validateToken, handlDecodeToken);
userRouter.put(
  "/update/:id",
  validateToken,
  multerUpload.single("avatar"),
  handlUpdateUser
);

export { userRouter };
