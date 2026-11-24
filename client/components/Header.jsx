import Icon from "./Icon";

const iconButton =
  "flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-navy-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

const Header = ({ sidebarOpen, onToggleSidebar, onNewChat, busy, toggleRef, inert }) => {
  return (
    <header
      inert={inert}
      className="shrink-0 border-b border-navy-700 bg-navy-900 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-white"
    >
      <div className="flex h-14 items-center gap-2 px-2 sm:px-3">
        <button
          ref={toggleRef}
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={sidebarOpen}
          aria-controls="chat-sidebar"
          className={iconButton}
        >
          <Icon name="menu" />
        </button>

        <img src="/favicon.svg" alt="" className="size-8 shrink-0" />
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold tracking-tight sm:text-xl">
          ReveBot
        </h1>

        {/* Shortcut for when the sidebar, which has its own button, is hidden */}
        {!sidebarOpen && (
          <button
            type="button"
            onClick={onNewChat}
            disabled={busy}
            aria-label="New chat"
            title="New chat"
            className={iconButton}
          >
            <Icon name="plus" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
