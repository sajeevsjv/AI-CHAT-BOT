import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Rendered only while a chat is waiting for confirmation
const DeleteChatDialog = ({ title, onConfirm, onCancel }) => {
  const dialogRef = useRef(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // close() before unmounting lets the browser return focus to the delete button
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  const cancel = () => {
    if (!deleting) onCancel();
  };

  const handleConfirm = async () => {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try {
      await onConfirm();
    } catch {
      setError("Could not delete chat. Please try again.");
      setDeleting(false);
    }
  };

  // Captured on window, wherever focus is, so Escape never reaches the drawer behind
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (!deleting) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [deleting, onCancel]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-chat-title"
      aria-describedby="delete-chat-text"
      onCancel={(e) => {
        e.preventDefault();
        cancel();
      }}
      onClose={() => {
        // the browser can force it shut, e.g. with the Android back gesture
        if (!dialogRef.current?.open) onCancel();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) cancel(); // backdrop
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl bg-white text-slate-800 shadow-2xl backdrop:bg-navy-900/60"
    >
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5">
        <h2 id="delete-chat-title" className="text-lg font-semibold">
          Delete chat?
        </h2>
        <p id="delete-chat-text" className="mt-2 text-sm wrap-anywhere text-slate-600">
          “{title}” and all its messages will be permanently deleted.
        </p>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={cancel}
            disabled={deleting}
            className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          {/* aria-disabled rather than disabled, so it keeps focus while deleting */}
          <button
            type="button"
            onClick={handleConfirm}
            aria-disabled={deleting}
            className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default DeleteChatDialog;
