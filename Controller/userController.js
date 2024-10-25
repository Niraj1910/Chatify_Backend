import UserModel from "../Model/userModel.js";
import { createTokenForUser } from "../services/jwt.js";
import jwt from "jsonwebtoken";
import {
  handleDeleteOldMedia,
  handleMediaUpload,
} from "../Config/cloudinary.js";
import { redisPublisher as redisClient } from "../Config/redis.js";

const handleSignUp = async (req, res) => {
  console.log("req.file -> ", req.file);
  console.log("req.body -> ", req.body);

  // delete the prev cache data
  await redisClient.DEL("dbAllUsers");

  const registerData = req.body;

  try {
    const existingUser = await UserModel.findOne({ email: registerData.email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }
    if (req.file) {
      const { url, public_id } = await handleMediaUpload(req.file);
      registerData.avatar = { url: url, public_id: public_id };
    }
    console.log("registerData -> ", registerData);
    const newUser = await UserModel.create(registerData);
    if (newUser) {
      return res.status(201).json({ message: "User successfully registered" });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const handleSignIn = async (req, res) => {
  const { userName, password } = req.body;

  try {
    const existingUser = await UserModel.findOne({ userName: userName });

    if (!existingUser || !existingUser.comparePassword(password)) {
      return res
        .status(404)
        .json({ message: "Incorrect userName or password" });
    }

    const token = createTokenForUser(existingUser);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.status(200).json({
      message: "Successfully Logged in",
    });
  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

function handleLogoutUser(req, res) {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  return res.status(200).json({ message: "Logged out successfully" });
}

const handlerGetAllUsers = async (req, res) => {
  try {
    let allUsers = await redisClient.GET("dbAllUsers");

    if (allUsers) {
      return res.status(200).json(JSON.parse(allUsers));
    }
    allUsers = await UserModel.find({}, "-password -salt");

    await redisClient.set("dbAllUsers", JSON.stringify(allUsers), {
      EX: 24 * 60 * 60,
    });

    return res.status(200).json(allUsers);
  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const handlDecodeToken = (req, res) => {
  try {
    const token = req.cookies.token;

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ data: payload });
  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const handlUpdateUser = async (req, res) => {
  console.log("req.file", req.file);
  console.log("req.body", req.body);

  // delete the prev cache data
  await redisClient.DEL("dbAllUsers");

  try {
    const userId = req.params.id;
    const { userName, email } = req.body;

    const user = await UserModel.findById(userId);

    if (req.file) {
      // Delete the old media if it exists
      if (user.avatar && user.avatar.public_id) {
        await handleDeleteOldMedia(user.avatar.public_id);
      }

      // Upload the new media
      const { url, public_id } = await handleMediaUpload(req.file.path); // Pass the file path or buffer

      // Update the user object with new media info
      user.avatar = {
        url,
        public_id,
      };
    }

    // Update user details
    if (userName) user.userName = userName;
    if (email) user.email = email;

    // Save the updated user
    const updatedUser = await UserModel.findByIdAndUpdate(userId, user, {
      new: true,
    });

    return res
      .status(200)
      .json({ message: "Successfully updated", data: updatedUser });
  } catch (error) {
    console.error("Server error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export {
  handleSignUp,
  handleSignIn,
  handlerGetAllUsers,
  handleLogoutUser,
  handlDecodeToken,
  handlUpdateUser,
};
