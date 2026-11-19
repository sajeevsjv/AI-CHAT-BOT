
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // optional until auth is added
      index: true,
    },

    title: {
      type: String,
      default: "New Chat",
    },

    model: {
      type: String,
      default: "gemini-3.8-flash",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);
