import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/mongoConnect.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
