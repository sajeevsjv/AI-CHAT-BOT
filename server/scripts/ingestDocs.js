// Copies the course documents in server/data/*.md into MongoDB. Run with: pnpm ingest:docs
import "dotenv/config";
import mongoose from "mongoose";
import { readCourseDocs } from "./courseDocs.js";
import { saveChunks, splitLines } from "./saveChunks.js";

try {
  const docs = await readCourseDocs();
  if (docs.length === 0) throw new Error("No .md files in server/data");
  const chunks = docs.flatMap(({ title, sections }) =>
    sections.flatMap(({ heading, lines }) => splitLines(lines).map((text) => ({ title, heading, text })))
  );
  await saveChunks(chunks, "document");
} catch (err) {
  console.error("Ingest failed:", err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
