import { Router } from "express";
import {
  handleCreateChat,
  handleGetChatMessages,
  handleGetUserChat,
} from "../Controller/chatController.js";

const chatRouter = Router();

chatRouter.get("/:chatId", handleGetChatMessages);
chatRouter.get("/user/:userId", handleGetUserChat);
chatRouter.post("/new", handleCreateChat);

export { chatRouter };
