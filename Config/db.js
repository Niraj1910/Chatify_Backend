import mongoose from "mongoose";

function connectToDB(URI) {
  mongoose
    .connect(URI)
    .then(() => console.log("Connected to DB"))
    .catch((err) => console.log("Could not connect to DB", err.message));
}

export { connectToDB };
