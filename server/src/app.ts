import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import { loggerMiddleware } from "./middlewares/loggerMiddleware";
import passport from "passport";
import session from "express-session";
import "./config/passport"; // import passport config

const app = express();

// Your frontend origin
const allowedOrigins = [
  "http://localhost:3000",
  "https://prompt-hub.vercel.app",
  "https://prompt-hub-six.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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

// Routes that don't use file upload parsing
app.use("/api/v1/health-check", healthCheckRoutes);

// User routes (register route inside this should use multer middleware)
// e.g., in users.routes.ts:
// router.post("/register", upload.single("avatar"), yourRegisterHandler);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/prompt", promptRoutes);
app.use("/api/v1/stats", statsRoutes)

export { app };
