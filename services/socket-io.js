import { Server } from "socket.io";
import { handleCreateMessage } from "../Controller/messageController.js";
import { redisPublisher, redisSubscriber } from "../Config/redis.js";

class SocketHandler {
  constructor(server, options) {
    this.io = new Server(server, options);
    this.Users = {};
    this.io.on("connection", (socket) => this.handleSocketConnection(socket));

    this.subscribeToRedisMessaagesChannel();
    this.subscribeToRedisActiveUsersChannel();
    this.subscribeToRedisOfflineUsersChannel();

    redisSubscriber.subscribe("call-req", (message) => {
      const requestDetails = JSON.parse(message);
      const { offer, sender, reciever, mediaType } = requestDetails;
      this.io.emit(`call-req:${reciever}`, { sender, offer, mediaType });
    });

    redisSubscriber.subscribe("call-reject", (message) => {
      const callStatus = JSON.parse(message);
      this.io.emit(`call-reject:${callStatus.sender}`, false);
    });

    redisSubscriber.subscribe("call-accept", (message) => {
      const answerDetails = JSON.parse(message);

      this.io.emit(`call-accept:${answerDetails.sender}`, answerDetails.answer);
    });

    redisSubscriber.subscribe("call-end", (to) => {
      to = JSON.parse(to);
      this.io.emit(`call-end:${to}`);
    });

    redisSubscriber.subscribe("ice-candidate", (message) => {
      const candidateDetails = JSON.parse(message);
      this.io.emit(
        `ice-candidate:${candidateDetails.to}`,
        candidateDetails.candidate
      );
    });
  }

  handleSocketConnection(socket) {
    console.log(`A user connected to socket with the socket id: ${socket.id}`);

    socket.on("call-req", (message) => {
      redisPublisher.publish(
        "call-req",
        JSON.stringify({
          offer: message.offer,
          sender: message.sender,
          reciever: message.reciever,
          mediaType: message.mediaType,
        })
      );
    });

    socket.on("call-reject", (message) => {
      redisPublisher.publish(
        "call-reject",
        JSON.stringify({
          sender: message.sender,
          status: false,
        })
      );
    });

    socket.on("call-accept", (message) => {
      redisPublisher.publish(
        "call-accept",
        JSON.stringify({
          answer: message.answer,
          sender: message.sender,
        })
      );
    });

    socket.on("call-end", (to) => {
      redisPublisher.publish("call-end", JSON.stringify(to));
    });

    socket.on("ice-candidate", (message) => {
      redisPublisher.publish(
        "ice-candidate",
        JSON.stringify({
          candidate: message.candidate,
          to: message.to,
        })
      );
    });

    socket.on("disconnect", () => this.handleSocketDisconnect(socket));
    socket.on("join", (userId) => this.handleSocketJoin(userId, socket));
    socket.on("chat-message", (msgDetails, callback) =>
      this.handleSocketChatMessage(msgDetails, socket, callback)
    );
  }

  subscribeToRedisActiveUsersChannel() {
    redisSubscriber.subscribe("ACTIVE-USERS", (user) => {
      user = JSON.parse(user);

      if (Object.entries(user).length) this.Users = { ...this.Users, ...user };

      console.log("All connected users from handleSocketJoin -> ", this.Users);

      this.io.emit("online-users", this.Users);
    });
  }

  subscribeToRedisOfflineUsersChannel() {
    redisSubscriber.subscribe("OFFLINE-USERS", (socketId) => {
      for (const key in this.Users) {
        if (this.Users[key] === socketId) {
          delete this.Users[key];
          break;
        }
      }
      console.log(
        "All connected users from handleSocketDisconnect -> ",
        this.Users
      );

      this.io.emit("online-users", this.Users);
    });
  }

  subscribeToRedisMessaagesChannel() {
    redisSubscriber.subscribe("MESSAGES", (message) => {
      const msgDetails = JSON.parse(message);

      // this.broadCastMessage(msgDetails);
      this.io.emit(`${msgDetails.chatId}`, {
        chatId: msgDetails.chatId,
        message: msgDetails.message,
        sender: msgDetails.sender,
        sender_avatar_url: msgDetails.sender_avatar_url,
        updatedAt: msgDetails.updatedAt,
      });
    });
  }

  async handleSocketDisconnect(socket) {
    console.log(`A user disconnected -> ${socket.id}`);

    redisPublisher.publish("OFFLINE-USERS", socket.id);
  }

  async handleSocketJoin(userId, socket) {
    if (userId) {
      console.log("userId -> ", userId);

      // redis pub/sub
      redisPublisher.publish(
        "ACTIVE-USERS",
        JSON.stringify({ [userId]: socket.id })
      );
    }
  }

  async handleSocketChatMessage(msgDetails, socket, callback) {
    console.log(`from the socketID: ${socket.id}`);
    console.log("msgDetails -> ", msgDetails);

    // redis pub/sub
    await redisPublisher.publish("MESSAGES", JSON.stringify(msgDetails));

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
      const senderId = msgDetails.sender._id;
      const content = msgDetails.message;

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
