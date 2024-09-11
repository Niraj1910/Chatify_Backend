import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    content: { type: String, required: true },
    files: [
      {
        url: { type: String },
        fileType: { type: String },
      },
    ],
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "chat", required: true },
    isGroupChat: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const MessageModel = mongoose.model("message", messageSchema);

export { MessageModel };
