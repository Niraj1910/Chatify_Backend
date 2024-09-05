import dotenv from "dotenv";
import express from "express";
import { createServer } from "node:http";

import { Server } from "socket.io";
import cors from "cors";
import { connectToDB } from "./Config/db.js";
import { userRouter } from "./Route/userRoute.js";
import cookieParser from "cookie-parser";

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
app.use(cookieParser());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.PROD_CLIENT_URL || process.env.DEV_CLIENT_URL,
  },
});

// call the connectDB
connectToDB(URI);

let users = [];

app.use("/api", userRouter);

io.on("connection", (socket) => {
  console.log(`a user connected -> ${socket.id}`);
  users.push({ id: socket.id });
  console.log("all connected users -> ", users);

  io.emit("all-users", users);

  // on disconnect
  socket.on("disconnect", () => {
    console.log(`a user disconnected -> ${socket.id}`);
    users = users.filter((user) => user.id !== socket.id);

    console.log("all connected users -> ", users);
  });

  // on recieving message
  socket.on("chat-msg", (msgDetails) => {
    // io.emit("chat-msg", msg);
    console.log("msgDetails -> ", msgDetails);
    const { sender, recipient, content } = msgDetails;
    // io.to(recipient).emit("chat-msg", content);
    io.to([sender, recipient]).emit("chat-msg", content);
  });
});

server.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
