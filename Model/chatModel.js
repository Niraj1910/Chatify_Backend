import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    chatName: { type: String },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "message",
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
    },
    isGroupChat: { type: Boolean, default: false },

    expireAt: { type: Date, expires: 0 },
  },
  { timestamps: true }
);

chatSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const ChatModel = mongoose.model("chat", chatSchema);

export { ChatModel };
