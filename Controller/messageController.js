import { MessageModel } from "../Model/messageModel.js";
import { ChatModel } from "../Model/chatModel.js";

const handleCreateMessage = async (senderId, content, chatId) => {
  try {
    if (!senderId || !chatId) throw new Error("SenderId or ChatId is missing");

    const newMessage = await MessageModel.create({
      sender: senderId,
      content: content,
      chat: chatId,
    });

    // update the chat or add the message in the chat
    await ChatModel.findByIdAndUpdate(
      chatId,
      {
        $push: { messages: newMessage._id },
        lastMessage: newMessage._id,
      },
      { new: true }
    );

    return newMessage;
  } catch (error) {
    console.log("Error in handleCreatChat ", error);
    throw new Error("Internal server error");
  }
};

export { handleCreateMessage };
