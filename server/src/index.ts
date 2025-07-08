import dotenv from "dotenv"
import connectDB from "./db/index"
import logger from "./utils/logger";
import { app } from "./app";

dotenv.config({
    path:"./.env"
  })
  



const PORT = process.env.PORT || 5000

connectDB()
.then(() => {
    app.listen(PORT, () => {
        console.log(`\n✅ Server is running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error("❌ Failed to connect to the database:", error);
    process.exit(1); // Exit the process with failure
}
);

// Handle uncaught exceptions and unhandled rejections
// This is important for production to avoid silent failures
// and to log errors properly.
process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}\n${error.stack}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});
