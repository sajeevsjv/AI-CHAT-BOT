const ChatHistory = ({ conversations, activeId, onSelect, onNewChat, onDelete }) => {
  return (
    <aside className="flex w-64 shrink-0 flex-col bg-gray-900 text-gray-100">
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full rounded-lg border border-gray-600 px-3 py-2 text-left text-sm hover:bg-gray-800"
        >
          + New chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 && (
          <p className="px-2 py-4 text-sm text-gray-400">No chats yet</p>
        )}

        {conversations.map((c) => (
          <div
            key={c._id}
            onClick={() => onSelect(c._id)}
            className={`group mb-1 flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm ${
              c._id === activeId ? "bg-gray-700" : "hover:bg-gray-800"
            }`}
          >
            <span className="truncate">{c.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c._id);
              }}
              title="Delete chat"
              className="ml-2 hidden text-gray-400 hover:text-red-400 group-hover:block"
            >
              ✕
            </button>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default ChatHistory;
