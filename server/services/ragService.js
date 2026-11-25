import KnowledgeChunk from "../db/models/knowledgeChunk.js";
import { embedQuery } from "./embeddingService.js";

export const VECTOR_INDEX = "knowledge_vector_index";
const TOP_K = 20; // sections are short, so this is only about 3k tokens

/**
 * Finds the website and document sections most relevant to the question.
 * @returns {Promise<{source?: string, url?: string, title: string, heading: string, text: string}[]>}
 */
export const retrieveContext = async (history, question) => {
  // Follow-ups like "what about its duration?" only make sense with the previous question
  const previous = history.filter((m) => m.role === "user").at(-1)?.content;
  const query = previous ? `${previous.slice(0, 500)}\n${question}` : question;

  const queryVector = await embedQuery(query.slice(0, 4000));

  const chunks = await KnowledgeChunk.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX,
        path: "embedding",
        queryVector,
        numCandidates: 150,
        limit: TOP_K,
      },
    },
    { $project: { _id: 0, source: 1, url: 1, title: 1, heading: 1, text: 1 } },
  ]).option({ maxTimeMS: 5000 });

  if (chunks.length === 0) {
    throw new Error("Knowledge base is empty. Run `pnpm ingest` first.");
  }
  return chunks;
};
