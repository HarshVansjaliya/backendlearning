import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}${DB_NAME}`, {});

    console.log(`\n mongodb connected !! DBHOST${connectionInstance}`);
    console.log(`connection host is ${connectionInstance.connection.host}`);
    
  } catch (error) {
    console.log("mongodb connection errorrr ", error);
    process.exit(1);
  }
};

export default connectDB;
