
import mongoose from "mongoose";


const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    // website pages and documents the answer is based on (model messages only)
    sources: {
      type: [{ _id: false, title: String, url: String }],
      default: undefined,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
