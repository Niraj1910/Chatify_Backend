// import mongoose from("mongoose");
import mongoose from "mongoose";
import { createHmac, randomBytes } from "crypto";

const UserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
    },
    avatar: {
      type: String,
      default: "/default-avatar.jpg",
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  const user = this;

  if (!user.isModified("password")) return next();

  const salt = randomBytes(16).toString();
  const hashedpassword = createHmac("sha256", salt)
    .update(user.password)
    .digest("hex");

  this.salt = salt;
  this.password = hashedpassword;

  return next();
});

UserSchema.methods.comparePassword = function (clientPassword) {
  const clientHashedpassword = createHmac("sha256", this.salt)
    .update(clientPassword)
    .digest("hex");

  return this.password === clientHashedpassword;
};

const UserModel = mongoose.model("user", UserSchema);
export default UserModel;
