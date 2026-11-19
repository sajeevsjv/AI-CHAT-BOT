import { Router } from "express";
import {
  sendMessage,
  getConversations,
  getMessages,
  deleteConversation,
} from "../controllers/chatController.js";

const router = Router();

router.post("/send-message", sendMessage);
router.get("/conversations", getConversations);
router.get("/conversations/:id/messages", getMessages);
router.delete("/conversations/:id", deleteConversation);

export default router;
