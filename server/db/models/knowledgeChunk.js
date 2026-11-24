import mongoose from "mongoose";

// One section of a reveforge.com page, plus its embedding vector.
const knowledgeChunkSchema = new mongoose.Schema(
  {
    hash: { type: String, required: true, unique: true }, // detects unchanged text on re-ingest
    url: { type: String, required: true },
    title: { type: String, required: true },
    heading: { type: String, default: "" },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

export default mongoose.model("KnowledgeChunk", knowledgeChunkSchema);
