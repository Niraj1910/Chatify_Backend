import { Server } from "socket.io";
import { handleCreateMessage } from "../Controller/messageController.js";
import { handleCreateChat } from "../Controller/chatController.js";
import { redisPublisher, redisSubscriber } from "../Config/redis.js";

class SocketHandler {
  constructor(server, options) {
    this.io = new Server(server, options);
    this.Users = {};
    this.io.on("connection", (socket) => this.handleSocketConnection(socket));

    this.subscribeToRedisChannel();
  }

  async getAllOnlineUsersFromRedis() {
    // get all user keys and values
    const userKeys = await redisPublisher.KEYS("userID:*");
    for (const userKey of userKeys) {
      const socketId = await redisPublisher.GET(userKey);
      this.Users[userKey.split(":")[1]] = socketId;
    }
  }

  subscribeToRedisChannel() {
    redisSubscriber.subscribe("chat_message", (message) => {
      const msgDetails = JSON.parse(message);

      this.broadCastMessage(msgDetails);
    });
  }

  async broadCastMessage(msgDetails) {
    console.log(`from broadcastMessage `, msgDetails);

    const socketIDs = await redisPublisher.MGET(
      ...msgDetails.chat_users.map((userID) => `userID:${userID}`)
    );

    if (socketIDs.length) {
      this.io.to([...socketIDs.filter(Boolean)]).emit("chat-message", {
        message: msgDetails.message,
        sender_id: msgDetails.sender_id,
        sender_avatar_url: msgDetails.sender_avatar_url,
      });
    }
  }

  handleSocketConnection(socket) {
    console.log(`A user connected to socket with the socket id: ${socket.id}`);

    socket.on("disconnect", () => this.handleSocketDisconnect(socket));
    socket.on("join", (userId) => this.handleSocketJoin(userId, socket));
    socket.on("chat-msg", (msgDetails, callback) =>
      this.handleSocketChatMessage(msgDetails, socket, callback)
    );
  }

  async handleSocketDisconnect(socket) {
    console.log(`A user disconnected -> ${socket.id}`);

    const userID = await redisPublisher.GET(`socketID:${socket.id}`);
    await redisPublisher.DEL(`socketID:${socket.id}`);
    await redisPublisher.DEL(`userID:${userID}`);
    delete this.Users[userID];

    console.log("All connected users -> ", this.Users);

    this.io.emit("online-users", this.Users);
  }

  async handleSocketJoin(userId, socket) {
    if (userId) {
      console.log("userId -> ", userId);

      const expirationTime = 5 * 60 * 60;

      await redisPublisher.SET(
        `socketID:${socket.id}`,
        userId,
        "EX",
        expirationTime
      );
      await redisPublisher.SET(
        `userID:${userId}`,
        socket.id,
        "EX",
        expirationTime
      );
      this.getAllOnlineUsersFromRedis();
    } else {
      console.log("Received null or undefined username");
    }
    this.Users[userId] = socket.id;

    console.log("All connected users -> ", this.Users);

    this.io.emit("online-users", this.Users);
  }

  async handleSocketChatMessage(msgDetails, socket, callback) {
    console.log(`from the socketID: ${socket.id}`);
    console.log("msgDetails -> ", msgDetails);

    const onlineUsers = [];
    msgDetails.chat_users.forEach((element) => {
      if (this.Users[element]) onlineUsers.push(this.Users[element]);
    });

    console.log("onlineUsers -> ", onlineUsers);

    // redis pub/sub
    await redisPublisher.publish("chat_message", JSON.stringify(msgDetails));

    // Database operations
    const result = await this.handleSaveMessageToDB(msgDetails);
    if (result.success) {
      callback({ success: true, message_id: result.message_id });
    } else {
      console.error("Error saving message", result.error);
      callback({ success: false });
    }
  }

  async handleSaveMessageToDB(msgDetails) {
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
      const messageResult = await handleCreateMessage(
        senderId,
        content,
        chatId
      );

      if (messageResult) {
        return { success: true, message_id: messageResult._id };
      } else {
        return { success: false, error: "Message creation failed" };
      }
    } catch (error) {
      console.error("Error saving message:", error);
      return { success: false, error };
    }
  }
}

export default SocketHandler;
