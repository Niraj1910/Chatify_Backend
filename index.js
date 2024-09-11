import dotenv from "dotenv";
import express from "express";
import { createServer } from "node:http";

import { Server } from "socket.io";
import cors from "cors";
import { connectToDB } from "./Config/db.js";
import cookieParser from "cookie-parser";
import { userRouter } from "./Route/userRoute.js";
import { chatRouter } from "./Route/chatRoute.js";

import { validateToken } from "./services/jwt.js";
import { handleCreateChat } from "./Controller/chatController.js";
import { handleCreateMessage } from "./Controller/messageController.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT;
const URI = process.env.URI;

app.use(
  cors({
    origin: process.env.PROD_CLIENT_URL || process.env.DEV_CLIENT_URL,
    credentials: true,
  })
);
app.use(express.static("public"));
app.use(express.json());
// app.use(express.urlencoded(true));
app.use(cookieParser());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.PROD_CLIENT_URL || process.env.DEV_CLIENT_URL,
  },
});

// call the connectDB
connectToDB(URI);

let users = {};

// user routes
app.use("/api", userRouter);

// chat routes
app.use("/api/chat", validateToken, chatRouter);

// socket connection
io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log(`a user disconnected -> ${socket.id}`);

    for (const key in users) {
      if (users[key] === socket.id) delete users[key];
      break;
    }

    console.log("all connected users -> ", users);
  });

  socket.on("join", (userId) => {
    if (userId) {
      console.log("userId -> ", userId);
      users[userId] = socket.id;
    } else console.log("Received null or undefined username");
    console.log("all connected users -> ", users);

    io.emit("online-users", users);
  });

  // on recieving message
  socket.on("chat-msg", async (msgDetails, callback) => {
    console.log("msgDetails -> ", msgDetails);

    const onlineUsers = [];
    msgDetails.chat_users.forEach((element) => {
      if (users[element]) onlineUsers.push(users[element]);
    });

    console.log("onlineUsers -> ", onlineUsers);

    io.to([...onlineUsers]).emit("chat-msg", {
      message: msgDetails.message,
      sender_id: msgDetails.sender_id,
      sender_avatar_url: msgDetails.sender_avatar_url,
    });

    // Database operations
    try {
      let chatId = msgDetails.chatId;
      const chatUsers = msgDetails.chat_users;
      const senderId = msgDetails.sender_id;
      const content = msgDetails.message;

      if (!chatId) {
        const result = await handleCreateChat(chatUsers[0], chatUsers[1]);
        console.log("result -> ", result);
        if (result) chatId = result._id;
      }
      const newMessageResult = await handleCreateMessage(
        senderId,
        content,
        chatId
      );

      if (newMessageResult)
        callback({ success: true, message_id: newMessageResult._id });
      console.log("newMessageResult -> ", newMessageResult);
    } catch (error) {
      console.log(error);
    }
  });
});

server.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
