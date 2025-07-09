import express from "express";
import type{ RequestHandler }  from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import { loggerMiddleware } from "./middlewares/loggerMiddleware";
import passport from "passport";
import session from "express-session";
import {errorHandler} from "./middlewares/error.middlewares"
import "./config/passport";



const app = express();

// Your frontend origin
// const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(origin => origin.trim()) || [];

app.use(
  cors({
    origin: "https://app.shopxet.com",
    credentials: true,
  })
);

app.set("trust proxy", 1); // ✅ Required when behind proxy (e.g. Webuzo/Nginx)



// Multer setup (memory storage, max 5MB file size)
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// set trust proxy
app.set("trust proxy", 1);
// Parse JSON and URL-encoded bodies for routes NOT expecting multipart/form-data
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Parse cookies
app.use(cookieParser());
// Serve static files
app.use(express.static("public"));


// Use custom logger middleware early
app.use(loggerMiddleware);

 // Passport.js setup
 app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());



// Import routes
import healthCheckRoutes from "./routes/health-check.routes";
import userRoutes from "./routes/users.routes";
import promptRoutes from "./routes/prompt.routes";
import statsRoutes from "./routes/stats.routes"

// Use routes
app.use("/api/v1/health-check", healthCheckRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/prompt", promptRoutes);
app.use("/api/v1/stats", statsRoutes)



// custom error middlewares
app.use(errorHandler)
export { app };
