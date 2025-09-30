// /src/components/messenger/MessageItem.jsx
import React, { useMemo } from "react";
import { SmilePlus } from "lucide-react";
import { useChat } from "../../context/ChatContext.jsx";
import { formatProfilePicture } from "../../utils/imageUtils";

const DEFAULT_PIC = "/default-profile.png";

export default function MessageItem({ message }) {
  const chat = useChat();
  const meId = chat?.meId;
  const mine = String(message.authorId) === String(meId);

  const author = useMemo(() => {
    const u = chat?.userMap?.[message.authorId];
    return {
      name: u?.firstName || u?.username || "User",
      avatar: formatProfilePicture(u?.profilePicture) || DEFAULT_PIC,
    };
  }, [chat?.userMap, message.authorId]);

  const date = new Date(message.createdAt || message.ts || Date.now());
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const reactions = message.reactions || {}; // { "👍": 2, "🎉": 1 }

  const bubbleClass = mine
    ? "bg-indigo-600 text-white"
    : "bg-surface border border-border text-text";

  return (
    <div className={`flex items-start gap-2 ${mine ? "flex-row-reverse" : ""}`}>
      <img
        src={author.avatar}
        alt={author.name}
        className="h-7 w-7 rounded-full border border-border object-cover"
      />
      <div className="max-w-[75%]">
        <div className={`rounded-2xl px-3 py-2 text-sm ${bubbleClass}`}>
          {!mine && <div className="text-[11px] opacity-70 mb-0.5">{author.name}</div>}
          <div>{message.text}</div>
          {Array.isArray(message.attachments) && message.attachments.length > 0 && (
            <div className="mt-2 text-[11px] opacity-80">
              {message.attachments.length} attachment{message.attachments.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Footer: time + reactions */}
        <div className={`mt-0.5 text-[11px] ${mine ? "text-right" : "text-left"} text-muted flex items-center gap-2 ${mine ? "justify-end" : ""}`}>
          <span>{timeStr}</span>
          <span className="inline-flex items-center gap-1">
            {Object.keys(reactions).map((emoji) => (
              <span
                key={emoji}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-[1px] bg-white/70 dark:bg-slate-800/60"
                title={`${emoji} × ${reactions[emoji]}`}
              >
                <span>{emoji}</span>
                <span>{reactions[emoji]}</span>
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* Quick react button (optional) */}
      {/* You can wire this to chat.toggleReaction if desired */}
      {/* <button className="ml-1 rounded-md border border-border p-1 hover:bg-surface" title="React">
        <SmilePlus className="w-4 h-4" />
      </button> */}
    </div>
  );
}
