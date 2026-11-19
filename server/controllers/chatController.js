import mongoose from "mongoose";
import Conversation from "../db/models/conversation.js";
import Message from "../db/models/message.js";
import { generateReply, DEFAULT_MODEL } from "../services/geminiService.js";

const HISTORY_LIMIT = 30; // how many past messages are sent to the model as context

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const makeTitle = (text) => {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean;
};

// POST /api/chat/send-message   body: { message, conversationId? }
export const sendMessage = async (req, res) => {
  const message = req.body?.message?.trim();
  const { conversationId } = req.body ?? {};

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  let conversation = null;
  let history = [];

  if (conversationId) {
    if (!isValidId(conversationId)) {
      return res.status(400).json({ error: "Invalid conversationId" });
    }
    conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    const recent = await Message.find({ conversationId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(HISTORY_LIMIT)
      .lean();
    history = recent.reverse();
  }

  // Ask the model first, so nothing is saved if generation fails
  let reply;
  try {
    reply = await generateReply(history, message, conversation?.model ?? DEFAULT_MODEL);
  } catch (err) {
    console.error("Gemini error:", err);
    return res.status(502).json({ error: "Failed to generate AI response" });
  }

  if (!conversation) {
    conversation = await Conversation.create({
      title: makeTitle(message),
      model: DEFAULT_MODEL,
      ...(req.user?.id && { userId: req.user.id }),
    });
  }

  const [userMessage, modelMessage] = await Message.insertMany([
    { conversationId: conversation._id, role: "user", content: message },
    { conversationId: conversation._id, role: "model", content: reply },
  ]);

  // bump updatedAt so the conversation moves to the top of the history list
  conversation.updatedAt = new Date();
  await conversation.save();

  res.status(201).json({ conversation, userMessage, modelMessage });
};

// GET /api/chat/conversations
export const getConversations = async (req, res) => {
  const filter = { isActive: true, ...(req.user?.id && { userId: req.user.id }) };
  const conversations = await Conversation.find(filter)
    .sort({ updatedAt: -1 })
    .select("title model updatedAt createdAt")
    .lean();
  res.json({ conversations });
};

// GET /api/chat/conversations/:id/messages
export const getMessages = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ error: "Invalid conversation id" });

  const conversation = await Conversation.findById(id).lean();
  if (!conversation || !conversation.isActive) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  const messages = await Message.find({ conversationId: id }).sort({ createdAt: 1, _id: 1 }).lean();
  res.json({ conversation, messages });
};

// DELETE /api/chat/conversations/:id
export const deleteConversation = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ error: "Invalid conversation id" });

  const deleted = await Conversation.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Conversation not found" });

  await Message.deleteMany({ conversationId: id });
  res.json({ success: true });
};
