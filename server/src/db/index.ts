import mongoose from "mongoose";
import { DB_NAME } from "../constants";

const connectDB = async (): Promise<void> => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`\n  Database connected! DB Host: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("❌ Database connection failed", error);
    process.exit(1); // Exit the process with failure
  }
};

export default connectDB;
