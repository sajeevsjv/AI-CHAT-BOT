import mongoose from "mongoose";

// One section of a reveforge.com page or a course document, plus its embedding vector.
const knowledgeChunkSchema = new mongoose.Schema(
  {
    hash: { type: String, required: true, unique: true }, // detects unchanged text on re-ingest
    source: { type: String, enum: ["website", "document"], default: "website" },
    url: { type: String }, // documents have no page to link to
    title: { type: String, required: true },
    heading: { type: String, default: "" },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

export default mongoose.model("KnowledgeChunk", knowledgeChunkSchema);
