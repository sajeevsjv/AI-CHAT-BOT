import { useEffect, useState } from "react";
import ChatHistory from "./ChatHistory";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import {
  sendMessage,
  getConversations,
  getMessages,
  deleteConversation,
} from "../api/chatApi";

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadConversations = async () => {
    try {
      setConversations(await getConversations());
    } catch {
      setError("Could not load chat history");
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleSelect = async (id) => {
    if (id === activeId || loading) return;
    setActiveId(id);
    setError("");
    setMessages([]);
    try {
      setMessages(await getMessages(id));
    } catch {
      setError("Could not load messages");
    }
  };

  const handleNewChat = () => {
    if (loading) return;
    setActiveId(null);
    setMessages([]);
    setError("");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this chat?")) return;
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (id === activeId) handleNewChat();
    } catch {
      setError("Could not delete chat");
    }
  };

  const handleSend = async (text) => {
    setError("");
    // show the user's message right away, replace it with the saved one later
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { _id: tempId, role: "user", content: text }]);
    setLoading(true);

    try {
      const { conversation, userMessage, modelMessage } = await sendMessage({
        message: text,
        conversationId: activeId,
      });
      setMessages((prev) => [...prev.filter((m) => m._id !== tempId), userMessage, modelMessage]);
      setActiveId(conversation._id);
      loadConversations(); // adds a new chat to the sidebar / moves it to the top
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatHistory
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
        onNewChat={handleNewChat}
        onDelete={handleDelete}
      />

      <main className="flex flex-1 flex-col">
        <MessageList messages={messages} loading={loading} />
        {error && (
          <p className="mx-4 mb-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}
        <ChatInput onSend={handleSend} disabled={loading} />
      </main>
    </div>
  );
};

export default ChatPage;
