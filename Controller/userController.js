import { json } from "express";
import UserModel from "../Model/userModel.js";
import { createTokenForUser } from "../services/jwt.js";
import jwt from "jsonwebtoken";

const handleSignUp = async (req, res) => {
  const registerData = req.body;

  try {
    const existingUser = await UserModel.findOne({ email: registerData.email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }
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
    res.cookie("token", token, { httpOnly: true });

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
    const allUsers = await UserModel.find({}, "-password -salt");

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

export {
  handleSignUp,
  handleSignIn,
  handlerGetAllUsers,
  handleLogoutUser,
  handlDecodeToken,
};
