import { useEffect, useRef } from "react";
import Icon from "./Icon";

// Below lg: a drawer over the chat. From lg up: a column that collapses beside it.
const ChatHistory = ({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  newChatRef,
  busy,
  open,
  isDesktop,
  onClose,
}) => {
  const closeRef = useRef(null);
  const isDrawer = open && !isDesktop;

  useEffect(() => {
    if (!isDrawer) return;
    closeRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawer, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-navy-900/60 transition-opacity duration-200 motion-reduce:transition-none lg:hidden ${
          isDrawer ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="chat-sidebar"
        aria-label="Chat history"
        role={isDrawer ? "dialog" : undefined}
        aria-modal={isDrawer || undefined}
        inert={!open}
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] shrink-0 flex-col border-r border-navy-700 bg-navy-900 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] text-slate-100 scheme-dark transition-[translate,margin] duration-200 motion-reduce:transition-none lg:static lg:z-auto lg:translate-x-0 lg:pt-0 ${
          open ? "translate-x-0 shadow-2xl lg:shadow-none" : "-translate-x-full lg:-ml-72"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between pr-2 pl-4 lg:hidden">
          <span className="font-semibold">Chats</span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="flex size-11 items-center justify-center rounded-lg text-slate-300 hover:bg-navy-800 hover:text-white"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="shrink-0 px-3 pt-1 pb-3 lg:pt-3">
          <button
            ref={newChatRef}
            type="button"
            onClick={onNewChat}
            disabled={busy}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="plus" className="size-4" />
            New chat
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pt-1 pb-3">
          {conversations.length === 0 && (
            <p className="px-2 py-4 text-sm text-slate-400">No chats yet</p>
          )}

          {conversations.map((c) => {
            const active = c._id === activeId;
            return (
              <div
                key={c._id}
                className={`mb-1 flex items-center rounded-lg text-sm ${
                  active ? "bg-navy-700 text-white" : "text-slate-300 hover:bg-navy-800"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(c._id)}
                  disabled={busy}
                  aria-current={active ? "true" : undefined}
                  title={c.title}
                  className="min-h-11 min-w-0 flex-1 truncate rounded-lg pl-3 text-left disabled:cursor-not-allowed"
                >
                  {c.title}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c)}
                  disabled={busy}
                  aria-label={`Delete chat: ${c.title}`}
                  title="Delete chat"
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon name="trash" className="size-4" />
                </button>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default ChatHistory;
