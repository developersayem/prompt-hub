import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import { loggerMiddleware } from "./middlewares/loggerMiddleware";

const app = express();

// Your frontend origin
const allowedOrigin = ["http://localhost:3000", "https://prompt-hub.vercel.app", "https://prompt-hub-six.vercel.app"];

// Setup CORS with credentials and specific origin
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Multer setup (memory storage, max 5MB file size)
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Parse JSON and URL-encoded bodies for routes NOT expecting multipart/form-data
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cookieParser());
app.use(express.static("public"));

// Use custom logger middleware early
app.use(loggerMiddleware);



// Import routes
import healthCheckRoutes from "./routes/health-check.routes";
import userRoutes from "./routes/users.routes";

// Routes that don't use file upload parsing
app.use("/api/v1/health-check", healthCheckRoutes);

// User routes (register route inside this should use multer middleware)
// e.g., in users.routes.ts:
// router.post("/register", upload.single("avatar"), yourRegisterHandler);
app.use("/api/v1/users", userRoutes);

export { app };
