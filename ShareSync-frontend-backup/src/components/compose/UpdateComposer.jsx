// /src/components/compose/UpdateComposer.jsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Paperclip, Send, X, Loader2, Globe, Lock } from "lucide-react";
import { toast } from "../ui/toast";

function clsx(...xs) {
  return xs.filter(Boolean).join(" ");
}

/** naive @mention parser: returns unique handles without @ */
function extractMentionsFrom(text = "") {
  const out = new Set();
  for (const m of text.matchAll(/(^|\s)@([\w.\-]{2,32})\b/g)) {
    out.add(m[2]);
  }
  return Array.from(out);
}

export default function UpdateComposer({
  placeholder = "Share an update…",
  onSubmit,                               // async (payload) => createdUpdate
  onUploadFiles,                          // async (FileList|File[]) => [{id,url,moderationStatus?,name?,size?,mime?}]
  disabled = false,

  // NEW (optional)
  allowVisibility = true,
  defaultVisibility = "private",          // 'public' | 'private'
  allowManualMentions = true,             // lets user add mentions beyond auto-parse
}) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]); // [{id,url,name,size,mime,moderationStatus}]
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [visibility, setVisibility] = useState(
    defaultVisibility === "public" ? "public" : "private"
  );

  // micro-interaction flags
  const [justPosted, setJustPosted] = useState(false);
  const [justAttached, setJustAttached] = useState(false);

  // Optional manual mentions (comma-separated, no @ needed)
  const [mentionsInput, setMentionsInput] = useState("");

  const fileInputRef = useRef(null);

  const canPost = useMemo(() => {
    const hasText = text.trim().length > 0;
    const hasFiles = attachments.length > 0;
    return (hasText || hasFiles) && !submitting && !uploading && !disabled;
  }, [text, attachments, submitting, uploading, disabled]);

  const handlePickFiles = async (files) => {
    if (!files || !files.length || !onUploadFiles) return;
    try {
      setUploading(true);
      const uploaded = await onUploadFiles(files);
      const arr = Array.isArray(uploaded) ? uploaded : [];
      if (arr.some((f) => (f?.moderationStatus || "").toLowerCase() === "pending")) {
        toast?.({
          title: "Upload pending review",
          description:
            "Some images/files require a quick moderation review. They’ll be visible once cleared.",
        });
      }
      setAttachments((prev) => [
        ...prev,
        ...arr.map((f) => ({
          id: f.id || f._id || f.url,
          url: f.url,
          name: f.name,
          size: f.size,
          mime: f.mime,
          moderationStatus: f.moderationStatus, // 'allowed' | 'pending'
        })),
      ]);

      // tiny pulse on successful attach
      setJustAttached(true);
      setTimeout(() => setJustAttached(false), 550);
    } catch (e) {
      const reason =
        e?.response?.data?.moderation?.reason ||
        e?.response?.data?.message ||
        e?.message ||
        "Upload failed.";
      toast?.({
        title: "Upload blocked",
        description: reason,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onFileInput = (e) => {
    const files = e.currentTarget.files;
    e.currentTarget.value = "";
    if (files?.length) handlePickFiles(files);
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((f) => String(f.id) !== String(id)));
  };

  const manualMentions = useMemo(() => {
    if (!allowManualMentions) return [];
    return (mentionsInput || "")
      .split(",")
      .map((s) => s.trim().replace(/^@/, ""))
      .filter(Boolean);
  }, [mentionsInput, allowManualMentions]);

  const autoMentions = useMemo(() => extractMentionsFrom(text), [text]);

  const mergedMentions = useMemo(() => {
    const set = new Set([...autoMentions, ...manualMentions]);
    return Array.from(set);
  }, [autoMentions, manualMentions]);

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault?.();
      if (!canPost || !onSubmit) return;

      const payload = {
        text: text.trim(),
        attachments: attachments.map((a) => ({ id: a.id, url: a.url })),
        mentions: mergedMentions,
        visibility: allowVisibility ? visibility : undefined,
      };

      try {
        setSubmitting(true);
        const res = await onSubmit(payload);

        // show pending note if any attached file is pending
        if (attachments.some((a) => (a.moderationStatus || "").toLowerCase() === "pending")) {
          toast?.({
            title: "Posted (some media pending)",
            description:
              "Your update is live. Some attachments will appear once moderation finishes.",
          });
        } else {
          toast?.({ title: "Update posted" });
        }

        // reset on success
        setText("");
        setAttachments([]);
        setMentionsInput("");
        setVisibility(defaultVisibility === "public" ? "public" : "private");

        // brief success glow on the Post button
        setJustPosted(true);
        setTimeout(() => setJustPosted(false), 700);

        return res;
      } catch (err) {
        const reason =
          err?.response?.data?.moderation?.reason ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to post update.";
        toast?.({
          title: "Update blocked",
          description: reason,
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [
      allowVisibility,
      attachments,
      canPost,
      defaultVisibility,
      mergedMentions,
      onSubmit,
      text,
      visibility,
    ]
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-3 hover-glow">
      <form onSubmit={handleSubmit}>
        {/* Top row: visibility + attach */}
        <div className="flex items-center justify-between mb-2">
          {allowVisibility ? (
            <div className="inline-flex items-center gap-1 text-xs">
              <label className="text-muted">Visibility</label>
              <div className="relative">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="rounded-md border border-border bg-white/90 dark:bg-slate-900/80 px-2 py-1 text-xs"
                  aria-label="Post visibility"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
                <div className="pointer-events-none absolute right-2 top-1.5 text-muted">
                  {visibility === "public" ? (
                    <Globe className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onFileInput}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className={clsx(
                "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 border border-border hover:bg-surface",
                "transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0",
                "hover-glow",
                justAttached && "shadow-[0_0_0_3px_var(--ring)]"
              )}
              aria-live="polite"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Paperclip className="w-4 h-4" />
                  Attach
                </>
              )}
            </button>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-xl border border-border bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-[box-shadow,transform] duration-150"
          disabled={disabled}
        />

        {/* Manual mentions (optional) */}
        {allowManualMentions && (
          <div className="mt-2">
            <label className="block text-[11px] text-muted mb-1">
              Mentions (optional) — comma separated (e.g.{" "}
              <code className="px-1 border rounded">@alice, @bob</code>)
            </label>
            <input
              type="text"
              value={mentionsInput}
              onChange={(e) => setMentionsInput(e.target.value)}
              placeholder="@alice, @bob"
              className="w-full rounded-lg border border-border bg-white/90 dark:bg-slate-900/80 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-[box-shadow,transform] duration-150"
            />
          </div>
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {attachments.map((f) => {
              const isImg =
                (f.mime || "").startsWith("image/") ||
                /\.(png|jpe?g|gif|webp|svg)$/i.test(f.url || "");
              const pending = (f.moderationStatus || "").toLowerCase() === "pending";
              return (
                <div
                  key={f.id}
                  className={clsx(
                    "group relative rounded-lg border border-border overflow-hidden bg-white/60 dark:bg-slate-900/60",
                    "transition-transform duration-150 ease-out hover:scale-[1.01]"
                  )}
                >
                  {/* remove button */}
                  <button
                    type="button"
                    onClick={() => removeAttachment(f.id)}
                    className="absolute top-1 right-1 z-10 rounded-md bg-black/50 text-white p-1 opacity-0 group-hover:opacity-100 transition"
                    aria-label="Remove attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {isImg ? (
                    <img
                      src={f.url}
                      alt={f.name || "attachment"}
                      className="w-full h-28 object-cover"
                    />
                  ) : (
                    <div className="h-28 grid place-items-center text-sm text-muted">
                      {f.name || "File"}
                    </div>
                  )}

                  {pending && (
                    <div className="absolute bottom-0 left-0 right-0 bg-amber-50/95 text-amber-800 text-[11px] px-2 py-1 border-t border-amber-200">
                      Pending review
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex items-center justify-end">
          <button
            type="submit"
            disabled={!canPost}
            className={clsx(
              "relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60",
              "transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0",
              "hover-glow",
              justPosted && "shadow-[0_0_0_4px_var(--ring)]"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}