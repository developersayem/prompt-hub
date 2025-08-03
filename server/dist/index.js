"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = __importDefault(require("./db/index"));
const logger_1 = __importDefault(require("./utils/logger"));
const app_1 = require("./app");
dotenv_1.default.config({
    path: "./.env"
});
const PORT = process.env.PORT || 5000;
(0, index_1.default)()
    .then(() => {
    app_1.app.listen(PORT, () => {
        console.log(`\n  Server is running on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error("❌ Failed to connect to the database:", error);
    process.exit(1); // Exit the process with failure
});
// Handle uncaught exceptions and unhandled rejections
// This is important for production to avoid silent failures
// and to log errors properly.
process.on("uncaughtException", (error) => {
    logger_1.default.error(`Uncaught Exception: ${error.message}\n${error.stack}`);
    process.exit(1);
});
process.on("unhandledRejection", (reason) => {
    logger_1.default.error(`Unhandled Rejection: ${reason}`);
    process.exit(1);
});
