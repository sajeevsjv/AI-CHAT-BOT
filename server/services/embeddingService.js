import { getClient } from "./geminiService.js";

const EMBEDDING_MODEL = "gemini-embedding-2";
export const EMBEDDING_DIMENSIONS = 768;

const embed = async (texts, timeoutMs) => {
  const response = await getClient().models.embedContent({
    model: EMBEDDING_MODEL,
    // Each text needs its own content object: gemini-embedding-2 merges a plain
    // array of strings into a single vector.
    contents: texts.map((text) => ({ parts: [{ text }] })),
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
      abortSignal: AbortSignal.timeout(timeoutMs),
    },
  });

  const vectors = response.embeddings?.map((e) => e.values) ?? [];
  if (vectors.length !== texts.length) {
    throw new Error(`Expected ${texts.length} embeddings, got ${vectors.length}`);
  }
  return vectors;
};

// gemini-embedding-2 takes the task as a text prefix; queries and documents use different ones
export const embedDocuments = (chunks) =>
  embed(chunks.map((c) => `title: ${c.title} - ${c.heading} | text: ${c.text}`), 60000);

export const embedQuery = async (query) => {
  const texts = [`task: search result | query: ${query}`];
  try {
    return (await embed(texts, 5000))[0];
  } catch (err) {
    console.warn(`Embedding failed, retrying (${err?.status ?? err?.name})`);
    return (await embed(texts, 5000))[0];
  }
};
