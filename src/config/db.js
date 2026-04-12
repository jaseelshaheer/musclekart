import mongoose from "mongoose";

const connectDB = async () => {
  // await mongoose.connect("mongodb://127.0.0.1:27017/musclekart");
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDb connected");
};

export default connectDB;
