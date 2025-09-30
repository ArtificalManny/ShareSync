import React, { useEffect, useRef, useState } from "react";
import { Paperclip, Send, Loader2 } from "lucide-react";

/**
 * MessageComposer
 * Props:
 * - onSend: async (text, files[]) => void
 * - onTyping?: (isTyping:boolean) => void
 * - disabled?: boolean
 */
export default function MessageComposer({ onSend, onTyping, disabled }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState([]);
  const fileRef = useRef(null);
  const typingRef = useRef(null);

  // typing ping (debounced stop)
  useEffect(() => {
    if (!onTyping) return;
    if (text.trim()) onTyping(true);
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => onTyping(false), 900);
    return () => clearTimeout(typingRef.current);
  }, [text, onTyping]);

  const chooseFiles = () => fileRef.current?.click();

  const onFile = (e) => {
    const f = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...f]);
    e.target.value = ""; // allow re-selecting same file
  };

  const send = async (e) => {
    e?.preventDefault?.();
    const t = text.trim();
    if (!t && files.length === 0) return;
    setBusy(true);
    try {
      await onSend?.(t, files);
      setText("");
      setFiles([]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={send} className="border-t border-border p-2 flex items-end gap-2">
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={onFile}
      />
      <button
        type="button"
        onClick={chooseFiles}
        className="rounded-md border border-border px-2 py-2 hover:bg-surface disabled:opacity-60"
        disabled={disabled || busy}
        title="Attach files"
      >
        <Paperclip className="w-4 h-4" />
      </button>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={1}
        placeholder="Write a message…"
        className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-none"
        disabled={disabled || busy}
      />
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-700 disabled:opacity-60"
        disabled={disabled || busy || (!text.trim() && files.length === 0)}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send
      </button>
      {files.length > 0 && (
        <span className="text-[11px] text-muted ml-1">{files.length} file(s)</span>
      )}
    </form>
  );
}
