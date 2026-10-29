import { prisma } from "./db.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import { authenticateToken, type AuthRequest } from "./middleware/auth.js";
import queueRouter from "./routes/queue.js";
import appointmentsRouter from "./routes/appointments.js";
import sosRouter from "./routes/sos.js";
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  }),
);

app.use(express.json());
app.use("/api/auth", authRouter);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "MedQueue backend is running",
    timestamp: new Date().toISOString(),
  });
});
app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "PostgreSQL connection successful",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});
app.get(
  "/api/auth/me",
  authenticateToken,
  (req: AuthRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Authentication verified successfully.",
      user: req.user,
    });
  }
);
app.use("/api/queue", queueRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/sos", sosRouter);

app.listen(PORT, () => {
  console.log(`MedQueue backend running at http://localhost:${PORT}`);
});
