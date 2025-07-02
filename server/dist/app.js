"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.upload = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const multer_1 = __importDefault(require("multer"));
const loggerMiddleware_1 = require("./middlewares/loggerMiddleware");
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
require("./config/passport"); // import passport config
const app = (0, express_1.default)();
exports.app = app;
// Your frontend origin
const allowedOrigins = [
    "http://localhost:3000",
    "https://prompt-hub.vercel.app",
    "https://prompt-hub-six.vercel.app",
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
// Multer setup (memory storage, max 5MB file size)
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});
// Parse JSON and URL-encoded bodies for routes NOT expecting multipart/form-data
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static("public"));
// Use custom logger middleware early
app.use(loggerMiddleware_1.loggerMiddleware);
// Passport.js setup
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: true,
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Import routes
const health_check_routes_1 = __importDefault(require("./routes/health-check.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const prompt_routes_1 = __importDefault(require("./routes/prompt.routes"));
const stats_routes_1 = __importDefault(require("./routes/stats.routes"));
// Routes that don't use file upload parsing
app.use("/api/v1/health-check", health_check_routes_1.default);
// User routes (register route inside this should use multer middleware)
// e.g., in users.routes.ts:
// router.post("/register", upload.single("avatar"), yourRegisterHandler);
app.use("/api/v1/users", users_routes_1.default);
app.use("/api/v1/prompt", prompt_routes_1.default);
app.use("/api/v1/stats", stats_routes_1.default);
