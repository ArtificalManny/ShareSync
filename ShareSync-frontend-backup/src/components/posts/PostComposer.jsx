import React, { useRef, useState } from "react";
import { Image as ImageIcon, Paperclip, Send } from "lucide-react";
import { createPost } from "../../api/posts";
import { uploadFiles } from "../../api/uploads"; // you already have this
import { toast } from "../ui/Toaster.jsx";
import { trackPostCreated } from "../../utils/telemetry";
import { useMentions } from "./MentionsProvider";

/**
 * PostComposer
 * Props:
 *  - projectId (required)
 *  - onPosted?: (post) => void
 *  - className?
 */
export default function PostComposer({ projectId, onPosted, className = "" }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]); // File[]
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const { menu, onKeyDown, onChange, attach, extractMentions } = useMentions();

  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length) setFiles((prev) => [...prev, ...picked]);
    e.target.value = "";
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const body = text.trim();
    if (!projectId) return;
    if (!body && files.length === 0) {
      setError("Write something or attach a file.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      // 1) upload attachments (if any)
      let attachmentIds = [];
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        const res = await uploadFiles(projectId, fd); // expect array of file objects
        attachmentIds = (Array.isArray(res) ? res : res?.items || []).map((f) => f.id || f._id).filter(Boolean);
      }

      // 2) mentions from text
      const mentions = extractMentions(body);

      // 3) create post
      const post = await createPost(projectId, {
        body,
        attachments: attachmentIds,
        mentions,
      });

      // 4) reset
      setText("");
      setFiles([]);
      try {
        toast({ title: "Posted", variant: "success" });
        trackPostCreated?.({ projectId, postId: post?.id || post?._id, attachments: attachmentIds.length, mentions: mentions.length });
      } catch {}
      onPosted?.(post);
    } catch (e2) {
      const msg = e2?.response?.data?.message || e2?.message || "Failed to post.";
      setError(msg);
      toast({ title: "Post failed", description: msg, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={`rounded-2xl border border-border bg-surface p-3 ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            ref={attach}
            value={text}
            onChange={(e) => { setText(e.target.value); onChange(e); }}
            onKeyDown={onKeyDown}
            rows={3}
            placeholder="Share an update… Use @ to mention people"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {/* Mentions menu (positioned absolutely; simple below-box placement) */}
          <div className="relative">{menu}</div>
        </div>

        {files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-xs rounded-lg border border-border px-2 py-1">
                <Paperclip className="w-3 h-3" />
                {f.name} ({Math.round(f.size / 1024)} KB)
                <button
                  type="button"
                  className="text-rose-600 hover:underline"
                  onClick={() => removeFile(i)}
                >
                  remove
                </button>
              </span>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs px-2 py-1">
            {error}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 border border-border hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <ImageIcon className="w-4 h-4" />
              Attach
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
              multiple
              className="hidden"
              onChange={onPickFiles}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>
    </section>
  );
}
