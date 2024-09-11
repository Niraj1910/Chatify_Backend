import { ChatModel } from "../Model/chatModel.js";

const handleGetChatMessages = async (req, res) => {
  try {
    const { senderId, recieverId } = req.params;

    const chat = await ChatModel.findOne({
      participants: { $all: [senderId, recieverId] },
    }).populate({
      path: "messages",
      populate: {
        path: "sender",
        select: "userName avatar",
      },
    });

    if (!chat) return res.status(404).json({ message: "Chat  not found" });

    return res.status(200).json(chat);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const handleCreateChat = async (senderId, recieverId) => {
  try {
    const existingChat = await ChatModel.findOne({
      participants: { $all: [senderId, recieverId] },
    });

    if (existingChat) return existingChat;

    const chat = await ChatModel.create({
      participants: [senderId, recieverId],
    });

    return chat;
  } catch (error) {
    console.log("Error in handleCreatChat ", error);
    throw new Error("Internal server error");
  }
};

export { handleGetChatMessages, handleCreateChat };
