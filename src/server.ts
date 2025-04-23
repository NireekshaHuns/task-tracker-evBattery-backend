import app from "./app";
import { connectDB } from "./config/database";
import { env } from "./config/env";

const startServer = async () => {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`Server running at http://localhost:${env.port}`);
  });
};

startServer();
