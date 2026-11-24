import { useLayoutEffect, useRef, useState } from "react";
import Icon from "./Icon";

const ChatInput = ({ onSend, disabled }) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  // Grow with the text, up to the max height set in the class list
  useLayoutEffect(() => {
    const el = textareaRef.current;
    el.style.height = "auto";
    const borders = el.offsetHeight - el.clientHeight;
    el.style.height = `${el.scrollHeight + borders}px`;
  }, [input]);

  const submit = () => {
    const text = input.trim();
    if (!text || disabled) return;
    onSend(text);
    setInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  // Enter sends, Shift+Enter adds a new line
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-slate-200 bg-white px-[max(0.75rem,env(safe-area-inset-left),env(safe-area-inset-right))] pb-[env(safe-area-inset-bottom)] sm:px-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))]"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2 py-3 sm:py-4">
        {/* text-base (16px) stops iOS zooming in on focus */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Message"
          placeholder="Message ReveBot..."
          className="max-h-[min(10rem,30dvh)] min-h-12 min-w-0 flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.75 text-base text-slate-900 outline-none placeholder:text-slate-500 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          aria-label="Send"
          className="flex h-12 min-w-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
        >
          <Icon name="send" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
