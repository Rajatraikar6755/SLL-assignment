require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
const { checkRole } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// Diagnostic checks for environment variables
if (!process.env.CLERK_SECRET_KEY) {
  console.warn("⚠️  WARNING: CLERK_SECRET_KEY is not set in environment variables!");
}
if (!process.env.DATABASE_URL) {
  console.warn("⚠️  WARNING: DATABASE_URL is not set in environment variables!");
}

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL, 
      "http://localhost:3000",
      "http://localhost:5173"
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const isVercel = origin.includes("vercel.app");
    const isAllowed = allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(o => origin.startsWith(o));

    if (isAllowed || isVercel) {
      callback(null, true);
    } else {
      console.error(`❌ CORS Blocked: ${origin}. Allowed: ${allowedOrigins.join(", ")} or any .vercel.app`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

// Import routers
const batchesRouter = require("./routes/batches");
const sessionsRouter = require("./routes/sessions");
const attendanceRouter = require("./routes/attendance");
const analyticsRouter = require("./routes/analytics");
const usersRouter = require("./routes/users");

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Mount routers
app.use("/api/batches", batchesRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api", analyticsRouter);
app.use("/api/users", usersRouter);

// Error handling middleware for Authentication or other errors
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  if (err.message === 'Unauthenticated') {
    return res.status(401).json({ error: "Unauthenticated: Invalid or missing token" });
  }
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
