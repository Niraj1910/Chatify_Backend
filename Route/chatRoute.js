import { Router } from "express";
import { handleGetChatMessages } from "../Controller/chatController.js";

const chatRouter = Router();

chatRouter.get("/:senderId/:recieverId", handleGetChatMessages);

export { chatRouter };
