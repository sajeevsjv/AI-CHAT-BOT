// Shared by ingest.js (website) and ingestDocs.js (course documents)
import { createHash } from "node:crypto";
import connectDB from "../db/mongoConnect.js";
import KnowledgeChunk from "../db/models/knowledgeChunk.js";
import { embedDocuments, EMBEDDING_DIMENSIONS } from "../services/embeddingService.js";
import { VECTOR_INDEX } from "../services/ragService.js";

const MAX_CHUNK_CHARS = 1500;
const EMBED_BATCH = 20;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Keeps each chunk under the limit, repeating the current sub-heading when a section is split
export const splitLines = (lines) => {
  const parts = [];
  let current = [];
  let subHeading = "";
  for (const line of lines) {
    if (line.startsWith("## ")) subHeading = line;
    const size = current.reduce((n, l) => n + l.length + 1, 0);
    if (current.length > 0 && size + line.length > MAX_CHUNK_CHARS) {
      parts.push(current);
      current = subHeading && subHeading !== line ? [subHeading] : [];
    }
    current.push(line);
  }
  if (current.length > 0) parts.push(current);
  return parts.map((p) => p.join("\n"));
};

const embedWithRetry = async (batch) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await embedDocuments(batch);
    } catch (err) {
      if (err?.status !== 429 || attempt >= 4) throw err;
      console.log("Rate limited by Gemini, waiting 60s...");
      await sleep(60000);
    }
  }
};

const ensureVectorIndex = async () => {
  const { collection } = KnowledgeChunk;
  const find = async () => (await collection.listSearchIndexes(VECTOR_INDEX).toArray())[0];

  if (!(await find())) {
    console.log("Creating vector search index...");
    await collection.createSearchIndex({
      name: VECTOR_INDEX,
      type: "vectorSearch",
      definition: {
        fields: [
          { type: "vector", path: "embedding", numDimensions: EMBEDDING_DIMENSIONS, similarity: "cosine" },
        ],
      },
    });
  }

  for (let i = 0; i < 60; i++) {
    const index = await find();
    if (index?.queryable) return;
    if (index?.status === "FAILED") throw new Error("Vector index build failed");
    await sleep(3000);
  }
  throw new Error("Vector index was not ready after 3 minutes. Check it in the Atlas UI.");
};

/**
 * Embeds new or edited chunks and removes outdated ones from the same source.
 * Chunks from the other source are never touched.
 * @param {{url?: string, title: string, heading: string, text: string}[]} chunks
 * @param {"website"|"document"} source
 */
export const saveChunks = async (chunks, source) => {
  for (const c of chunks) {
    c.source = source;
    c.hash = createHash("sha256").update([c.url, c.title, c.heading, c.text].join("\n")).digest("hex");
  }
  const unique = [...new Map(chunks.map((c) => [c.hash, c])).values()];

  if (process.argv.includes("--dry-run")) {
    for (const c of unique) console.log(`\n=== ${c.url ?? "document"}\n[${c.title} - ${c.heading}]\n${c.text}`);
    console.log(`\n${unique.length} sections (dry run, nothing saved)`);
    return;
  }

  await connectDB();
  await KnowledgeChunk.createCollection();

  const stored = new Set(await KnowledgeChunk.distinct("hash"));
  const fresh = unique.filter((c) => !stored.has(c.hash));
  for (let i = 0; i < fresh.length; i += EMBED_BATCH) {
    const batch = fresh.slice(i, i + EMBED_BATCH);
    const vectors = await embedWithRetry(batch);
    await KnowledgeChunk.insertMany(batch.map((c, j) => ({ ...c, embedding: vectors[j] })));
    console.log(`Embedded ${i + batch.length}/${fresh.length}`);
  }

  // Website chunks saved before "source" existed don't have the field
  const { deletedCount } = await KnowledgeChunk.deleteMany({
    source: source === "document" ? "document" : { $ne: "document" },
    hash: { $nin: unique.map((c) => c.hash) },
  });
  await ensureVectorIndex();
  console.log(`Done: ${fresh.length} added, ${deletedCount} outdated removed, ${unique.length} ${source} sections`);
};
