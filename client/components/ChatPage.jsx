import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./Header";
import ChatHistory from "./ChatHistory";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import DeleteChatDialog from "./DeleteChatDialog";
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
  const [deleteTarget, setDeleteTarget] = useState(null); // chat awaiting confirmation
  const newChatRef = useRef(null);
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

  const resetChat = () => {
    selectedRef.current = null;
    setActiveId(null);
    setMessages([]);
    setError("");
  };

  const handleNewChat = () => {
    if (loading) return;
    closeDrawer();
    resetChat();
  };

  // Throws on failure so the dialog can show the error and offer a retry
  const handleDelete = async () => {
    const id = deleteTarget._id;
    try {
      await deleteConversation(id);
    } catch (err) {
      if (err.response?.status !== 404) throw err; // 404: already deleted elsewhere
    }
    setConversations((prev) => prev.filter((c) => c._id !== id));
    if (id === activeId) resetChat();
    setDeleteTarget(null);
  };

  // The deleted row takes its focused button with it, so move focus somewhere useful
  useEffect(() => {
    if (!deleteTarget) return;
    const newChat = newChatRef.current;
    return () => {
      if (document.activeElement === document.body) newChat?.focus();
    };
  }, [deleteTarget]);

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
          onDelete={setDeleteTarget}
          newChatRef={newChatRef}
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

      {deleteTarget && (
        <DeleteChatDialog
          title={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default ChatPage;
