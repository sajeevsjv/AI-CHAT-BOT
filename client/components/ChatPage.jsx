import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./Header";
import ChatHistory from "./ChatHistory";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import useMediaQuery from "./useMediaQuery";
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
  const selectedRef = useRef(null); // latest chat picked, so slower responses are ignored

  // The drawer (small screens) and the column (Tailwind lg and up) open separately,
  // so resizing or rotating never leaves the drawer covering the chat
  const isDesktop = useMediaQuery("(min-width: 64rem)");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [columnOpen, setColumnOpen] = useState(true);
  const toggleRef = useRef(null);
  const sidebarOpen = isDesktop ? columnOpen : drawerOpen;
  const drawerActive = drawerOpen && !isDesktop;

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const toggleSidebar = () => {
    if (isDesktop) setColumnOpen((prev) => !prev);
    else setDrawerOpen((prev) => !prev);
  };

  // Forget the drawer once there is room for the column
  if (isDesktop && drawerOpen) setDrawerOpen(false);

  // Hand focus back to the menu button when the drawer closes
  useEffect(() => {
    if (!drawerActive) return;
    const toggle = toggleRef.current;
    return () => toggle?.focus();
  }, [drawerActive]);

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
    if (loading) return;
    closeDrawer();
    if (id === activeId) return;
    selectedRef.current = id;
    setActiveId(id);
    setError("");
    setMessages([]);
    try {
      const loaded = await getMessages(id);
      if (selectedRef.current === id) setMessages(loaded);
    } catch {
      if (selectedRef.current === id) setError("Could not load messages");
    }
  };

  const handleNewChat = () => {
    if (loading) return;
    closeDrawer();
    selectedRef.current = null;
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
      selectedRef.current = conversation._id;
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
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50">
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        onNewChat={handleNewChat}
        busy={loading}
        toggleRef={toggleRef}
        inert={drawerActive}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ChatHistory
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onNewChat={handleNewChat}
          onDelete={handleDelete}
          busy={loading}
          open={sidebarOpen}
          isDesktop={isDesktop}
          onClose={closeDrawer}
        />

        <main inert={drawerActive} className="flex min-w-0 flex-1 flex-col">
          <MessageList messages={messages} loading={loading} />
          {error && (
            <div className="px-3 pb-2 sm:px-4">
              <p
                role="alert"
                className="mx-auto max-w-3xl rounded-lg bg-red-50 px-4 py-2 text-sm wrap-anywhere text-red-700"
              >
                {error}
              </p>
            </div>
          )}
          <ChatInput onSend={handleSend} disabled={loading} />
        </main>
      </div>
    </div>
  );
};

export default ChatPage;
