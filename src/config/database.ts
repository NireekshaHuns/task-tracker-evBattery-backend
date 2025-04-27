import jsonDb from "../database/jsonDB";

// Initialize the local JSON database
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
