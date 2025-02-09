import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export default async () => {
  const mongourl = process.env.mongodb_url;
  try {
    mongoose.connect(mongourl as any).then(() => {
      console.log("Connected to MongoDB");
    });
  } catch (error) {
    console.log(error);
  }
};
