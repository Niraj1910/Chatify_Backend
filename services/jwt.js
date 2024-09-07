import jwt from "jsonwebtoken";

const createTokenForUser = (user) => {
  const payload = {
    _id: user._id,
    avatar: user.avatar,
    userName: user.userName,
    email: user.email,
    avatar: user.avatar,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return token;
};

function validateToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(404).json({ message: "No token found" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded)
    return res
      .status(401)
      .json({ message: "Invalid token", error: error.message });

  // return res.status(200).json({ payload: decoded });
  next();
}

export { createTokenForUser, validateToken };
