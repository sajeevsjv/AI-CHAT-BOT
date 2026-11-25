import { useEffect, useRef } from "react";

const MessageList = ({ messages, loading }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 text-center">
        <div className="m-auto">
          <img src="/favicon.svg" alt="" className="mx-auto mb-4 size-14 sm:size-16" />
          <p className="text-xl font-semibold text-slate-800 sm:text-2xl">
            How can I help you today?
          </p>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Ask me anything about Reveforge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[max(0.75rem,env(safe-area-inset-left),env(safe-area-inset-right))] py-4 sm:px-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] sm:py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((m) => (
          <div key={m._id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] min-w-0 whitespace-pre-wrap wrap-anywhere rounded-2xl px-4 py-3 leading-relaxed sm:max-w-[80%] ${
                m.role === "user"
                  ? "rounded-br-md bg-brand-600 text-white"
                  : "rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm"
              }`}
            >
              {m.content}
              {m.sources?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-2 text-xs">
                  <span className="text-slate-500">Sources:</span>
                  {m.sources.map((s) =>
                    s.url ? (
                      <a
                        key={s.url}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:underline"
                      >
                        {s.title}
                      </a>
                    ) : (
                      <span key={s.title} className="text-slate-700">
                        {s.title}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-slate-500 shadow-sm">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default MessageList;
