import jsonDb from "../database/jsonDB";

const connectDB = async (): Promise<void> => {
  try {
    jsonDb.initializeDb();
    console.log("JSON Database Initialized");
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
