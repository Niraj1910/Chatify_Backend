import { ChatModel } from "../Model/chatModel.js";

const handleGetChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await ChatModel.findById(chatId).populate({
      // add chat id value because it is being used on client side
      path: "messages",
      populate: {
        path: "sender",
        select: "userName avatar",
      },
    });

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    return res.status(200).json(chat);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const handleGetUserChat = async (req, res) => {
  try {
    const { userId } = req.params;

    const chat = await ChatModel.find({ participants: userId })
      .select("-messages")
      .populate("participants", "userName email avatar")
      .populate({
        path: "lastMessage",
        select: "content createdAt ",
        populate: {
          path: "sender",
          select: "userName email avatar",
        },
      })
      .sort("-updatedAt")
      .exec();

    return res.status(200).json(chat);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const handleCreateChat = async (req, res) => {
  const users = req.body.map((user) => user._id);

  console.log("users -> ", users);

  // const existedChat = await ChatModel.findOne({
  //   participants: { $all: users },
  // });

  // if (existedChat) {
  //   const populatedChat = await ChatModel.findById(existedChat._id)
  //     .populate({
  //       path: "participants",
  //       select: "userName email avatar",
  //     })
  //     .exec();

  //   return res.status(200).json(populatedChat);
  // }

  try {
    const expirationTime = new Date(Date.now() + 5 * 60 * 60 * 1000); // delete the chat after 5 hours if the messages are none
    // const expirationTime = new Date(Date.now() + 1000); // delete the chat after 5 hours if the messages are none

    const chat = await ChatModel.create({
      participants: users,
      isGroupChat: users.length > 2 ? true : false,
      expireAt: expirationTime,
    });

    const populatedChat = await ChatModel.findById(chat._id)
      .populate({
        path: "participants",
        select: "userName email avatar ",
      })
      .exec();

    return res.status(200).json(populatedChat);
  } catch (error) {
    console.log("Error in handleCreatChat ", error);
    throw new Error("Internal server error");
  }
};

export { handleGetChatMessages, handleCreateChat, handleGetUserChat };
