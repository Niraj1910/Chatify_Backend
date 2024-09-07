import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";
config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

async function handleMediaUpload(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) {
          console.log("Cloudinay upload error", error);
          return reject(new Error("Failed to upload image"));
        }
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(file.buffer);
  });
}

async function handleDeleteOldMedia(public_id) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(public_id, (error, result) => {
      if (error) {
        console.log("Cloudinary deleting error", error);
        reject(new Error("Failed to delete old image"));
      }

      resolve(result);
    });
  });
}

export { cloudinary, handleMediaUpload, handleDeleteOldMedia };
