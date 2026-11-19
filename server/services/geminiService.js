import { GoogleGenAI } from "@google/genai";

export const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

let ai;
const getClient = () => {
  // created lazily so dotenv has loaded before we read the key
  if (!ai) ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai;
};

/**
 * @param {{role: "user"|"model", content: string}[]} history - previous messages, oldest first
 * @param {string} prompt - the new user message
 * @param {string} model
 * @returns {Promise<string>}
 */
export const generateReply = async (history, prompt, model = DEFAULT_MODEL) => {
  const contents = [
    ...history.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
    { role: "user", parts: [{ text: prompt }] },
  ];

  const request = {
    model,
    contents,
    config: {
      systemInstruction: "You are a helpful, friendly assistant. Keep answers clear and concise.",
    },
  };

  // retry a couple of times when Gemini is overloaded (503) or rate limited (429)
  const MAX_RETRIES = 2;
  let response;
  for (let attempt = 0; ; attempt++) {
    try {
      response = await getClient().models.generateContent(request);
      break;
    } catch (err) {
      const retryable = err?.status === 503 || err?.status === 429;
      if (!retryable || attempt >= MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }

  const text = response.text?.trim();
  if (!text) throw new Error("Empty response from Gemini");
  return text;
};
