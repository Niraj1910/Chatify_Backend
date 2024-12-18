import dotenv from "dotenv";
import express from "express";
import { createServer } from "node:http";

import cors from "cors";
import { connectToDB } from "./Config/db.js";
import cookieParser from "cookie-parser";
import { userRouter } from "./Route/userRoute.js";
import { chatRouter } from "./Route/chatRoute.js";

import { validateToken } from "./services/jwt.js";

import SocketHandler from "./services/socket-io.js";
import { connectRedis } from "./Config/redis.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT;
const URI = process.env.URI;

app.use(
  cors({
    origin: process.env.PROD_CLIENT_URL || process.env.DEV_CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

const server = createServer(app);

// call the connectDB
connectToDB(URI);

// connect to redis
connectRedis();

// initiate the socket connection from socket class
new SocketHandler(server, {
  cors: {
    origin: process.env.PROD_CLIENT_URL || process.env.DEV_CLIENT_URL,
    credentials: true,
  },
});

// added a check rout
app.get("/", (req, res) => {
  res.send("hello from chatify server");
});

// user routes
app.use("/api", userRouter);

// chat routes
app.use("/api/chat", validateToken, chatRouter);

server.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
