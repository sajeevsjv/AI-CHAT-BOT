import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/mongoConnect.js";
import chatRoutes from "./routes/chatRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Browser origins allowed to call the API: comma-separated in CORS_ORIGINS.
// Defaults to the Vite dev and preview servers.
const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:4173"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, "")) // browsers send no trailing slash
  .filter(Boolean);

// Auth uses a Bearer token rather than cookies, so credentials stay off
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("test success!");
});

app.use("/api/chat", chatRoutes);

// Express 5 forwards errors thrown in async handlers here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

await connectDB();

app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
