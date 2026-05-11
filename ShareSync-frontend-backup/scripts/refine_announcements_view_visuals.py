from pathlib import Path
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-announcements-visual-refine-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

required_before = [
    "function AnnouncementCard",
    "function AttachmentGallery",
    "export default function AnnouncementsView",
    "const TYPE_STYLES = {",
    "Post Announcement",
    "Broadcast Update",
    "toggleAnnouncementPin",
    "deleteAnnouncement",
    "toggleLike",
    "addComment",
]

for marker in required_before:
    if marker not in text:
        raise SystemExit(f"❌ Missing expected marker `{marker}`. No changes written.")

# ─────────────────────────────────────────────────────────────────────────────
# Helper: replace a named function safely by brace matching.
# ─────────────────────────────────────────────────────────────────────────────

def replace_function(source: str, function_name: str, replacement: str) -> str:
    marker = f"function {function_name}("
    start = source.find(marker)

    if start == -1:
        raise SystemExit(f"❌ Could not find `{marker}`. No changes written.")

    brace_start = source.find("{", start)

    if brace_start == -1:
        raise SystemExit(f"❌ Could not find opening brace for `{function_name}`. No changes written.")

    depth = 0
    end = None

    for index in range(brace_start, len(source)):
        char = source[index]

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1

            if depth == 0:
                end = index + 1
                break

    if end is None:
        raise SystemExit(f"❌ Could not find closing brace for `{function_name}`. No changes written.")

    return source[:start] + replacement.strip() + source[end:]


# ─────────────────────────────────────────────────────────────────────────────
# 1. Upgrade type style tokens while preserving existing fields.
# ─────────────────────────────────────────────────────────────────────────────

type_start = text.find("const TYPE_STYLES = {")
type_end_marker = "\n// ─── Hot-Swapped Avatar Component"
type_end = text.find(type_end_marker, type_start)

if type_start == -1 or type_end == -1:
    raise SystemExit("❌ Could not locate TYPE_STYLES block. No changes written.")

new_type_styles = """
const TYPE_STYLES = {
  info: {
    label: 'Info',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
    text: 'text-violet-700',
    accent: 'bg-violet-500',
    soft: 'bg-violet-50/80',
    ring: 'ring-violet-500/10',
    glow: 'shadow-violet-500/10',
    chip: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  warning: {
    label: 'Warning',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    accent: 'bg-amber-500',
    soft: 'bg-amber-50/80',
    ring: 'ring-amber-500/10',
    glow: 'shadow-amber-500/10',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  success: {
    label: 'Success',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    accent: 'bg-emerald-500',
    soft: 'bg-emerald-50/80',
    ring: 'ring-emerald-500/10',
    glow: 'shadow-emerald-500/10',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  urgent: {
    label: 'Urgent',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
    accent: 'bg-rose-500',
    soft: 'bg-rose-50/80',
    ring: 'ring-rose-500/10',
    glow: 'shadow-rose-500/10',
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};
"""

text = text[:type_start] + new_type_styles.strip() + text[type_end:]


# ─────────────────────────────────────────────────────────────────────────────
# 2. Upgrade attachment image framing.
# ─────────────────────────────────────────────────────────────────────────────

new_attachment_gallery = """
function AttachmentGallery({ attachments }) {
  const urls = Array.isArray(attachments)
    ? attachments.map(a => typeof a === 'string' ? a : (a?.url || a?.fileUrl || null)).filter(Boolean)
    : [];

  if (urls.length === 0) return null;

  const isSingle = urls.length === 1;

  return (
    <div className={`mt-5 ${isSingle ? '' : 'grid grid-cols-2 gap-3'}`}>
      {urls.map((url, i) => (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-2xl border border-slate-200 bg-white p-1 shadow-sm hover:shadow-xl hover:shadow-violet-500/10 transition-all overflow-hidden"
        >
          <img
            src={url}
            alt={`Announcement attachment ${i + 1}`}
            className={`w-full rounded-[1rem] object-cover transition-transform duration-500 group-hover:scale-[1.015] ${
              isSingle ? 'max-h-[420px]' : 'aspect-[4/3]'
            }`}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </a>
      ))}
    </div>
  );
}
"""

text = replace_function(text, "AttachmentGallery", new_attachment_gallery)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Upgrade AnnouncementCard.
# ─────────────────────────────────────────────────────────────────────────────

new_announcement_card = """
function AnnouncementCard({ item, projectId, currentUser, onPin, onDelete, onUpdate }) {
  const rawType = String(item.type || 'info').toLowerCase();
  const style = TYPE_STYLES[rawType] || TYPE_STYLES.info;
  const isPinned = item.pinned;
  const isUrgent = rawType === 'urgent';
  const [liking, setLiking] = useState(false);

  const currentUserId = String(currentUser?.userId || currentUser?._id || currentUser?.id || currentUser?.sub || '');
  const authorIdStr = String(item.authorId?._id || item.authorId || '');
  const isMe = currentUserId && authorIdStr === currentUserId;
  const authorName = getAuthorName(isMe ? currentUser : item.authorId);

  const displayTitle = item.title || item.subject || item.name || 'Untitled Announcement';
  const displayMessage = item.message || item.content || item.text || item.description || '';

  const likes = Array.isArray(item.likes) ? item.likes : [];
  const likeCount = likes.length;
  const hasLiked = likes.some(l => String(l?._id || l) === currentUserId);
  const commentCount = Array.isArray(item.comments) ? item.comments.length : 0;
  const engagementCount = likeCount + commentCount;

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);

    try {
      const updated = await toggleLike(projectId, getId(item));
      onUpdate(updated);
    } catch {
      toast({ title: 'Failed to like', variant: 'error' });
    } finally {
      setLiking(false);
    }
  };

  return (
    <article
      className={`group relative mb-6 overflow-hidden rounded-[2rem] border bg-white transition-all duration-300 shadow-sm hover:-translate-y-0.5 hover:shadow-2xl ${
        isPinned
          ? 'border-amber-200 shadow-amber-500/10'
          : isUrgent
            ? 'border-rose-200 shadow-rose-500/10'
            : 'border-slate-200 hover:shadow-violet-500/10'
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${style.accent}`} />
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {isPinned && (
        <div className="relative flex items-center justify-between gap-3 border-b border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50 to-white px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-sm">
              <Pin className="h-3.5 w-3.5 fill-current" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-800">
              Pinned Broadcast
            </span>
          </div>
          <span className="hidden text-[11px] font-bold text-amber-700/80 sm:inline">
            Stays visible at the top of the feed
          </span>
        </div>
      )}

      <div className="relative px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <Avatar author={item.authorId} size="lg" currentUser={currentUser} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="block truncate text-sm font-black leading-tight text-slate-950">
                  {authorName}
                </span>

                {isMe && (
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-violet-700">
                    You
                  </span>
                )}

                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${style.chip}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                  {style.label}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {timeAgo(item.createdAt)}
                </span>

                {engagementCount > 0 && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span>{engagementCount} signal{engagementCount === 1 ? '' : 's'}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1.5">
            <button
              onClick={() => onPin(getId(item))}
              className={`rounded-xl p-2.5 transition-all ${
                isPinned
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              }`}
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="h-4 w-4" />
            </button>

            <button
              onClick={() => onDelete(getId(item))}
              className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={`mt-5 rounded-2xl border ${style.border} ${style.soft} p-5 ring-1 ${style.ring}`}>
          <h3 className="mb-2 text-xl font-black leading-tight tracking-tight text-slate-950">
            {displayTitle}
          </h3>

          <p className="whitespace-pre-line text-[15px] font-medium leading-7 text-slate-700">
            {displayMessage}
          </p>

          <AttachmentGallery attachments={item.attachments} />
        </div>
      </div>

      {(likeCount > 0 || commentCount > 0) && (
        <div className="mx-6 flex items-center justify-between border-t border-slate-100 py-3 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-2">
            {likeCount > 0 && (
              <>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 shadow-sm">
                  <Heart className="h-3.5 w-3.5 fill-white text-white" />
                </span>
                <span className="text-slate-700">{likeCount}</span>
              </>
            )}
          </div>

          {commentCount > 0 && (
            <span className="text-slate-700">
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-black transition-all ${
            hasLiked
              ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
              : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950 hover:shadow-sm'
          }`}
        >
          <Heart className={`h-4 w-4 ${hasLiked ? 'fill-rose-500' : ''}`} />
          <span>{hasLiked ? 'Liked' : 'Like'}</span>
        </button>

        <div className="h-7 w-px bg-slate-200" />

        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-transparent py-3 text-sm font-black text-slate-600 transition-all hover:border-slate-200 hover:bg-white hover:text-slate-950 hover:shadow-sm"
          onClick={() => {
            const el = document.querySelector(`[data-comment-input="${getId(item)}"]`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.querySelector('input')?.focus();
            }
          }}
        >
          <MessageCircle className="h-4 w-4" />
          <span>Comment</span>
        </button>
      </div>

      <div data-comment-input={getId(item)}>
        <CommentSection item={item} projectId={projectId} currentUser={currentUser} onUpdate={onUpdate} />
      </div>
    </article>
  );
}
"""

text = replace_function(text, "AnnouncementCard", new_announcement_card)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Upgrade main header panel.
# ─────────────────────────────────────────────────────────────────────────────

old_header = """      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-xl shadow-md"><Megaphone className="w-6 h-6 text-white" /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Announcements</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Broadcast high-signal updates to your team</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} disabled={loading} className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50 transition-all border border-transparent hover:border-slate-200 shadow-sm">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5">
            <Plus className="w-5 h-5" /> Post Update
          </button>
        </div>
      </div>"""

new_header = """      <div className="relative overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(124,58,237,0.12),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(20,184,166,0.10),transparent_30%)]" />

        <div className="relative flex flex-col gap-5 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 shadow-xl shadow-slate-900/20">
              <Megaphone className="h-7 w-7 text-white" />
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">
                  Signal Board
                </span>

                {sorted.some((a) => a.pinned) && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                    Pinned active
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Announcements
              </h2>

              <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                Broadcast high-signal updates, decisions, warnings, and project-wide context your team should not miss.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                  {sorted.length} update{sorted.length === 1 ? '' : 's'}
                </span>

                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                  {sorted.filter((a) => a.pinned).length} pinned
                </span>

                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                  Team-visible
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:self-start">
            <button
              onClick={load}
              disabled={loading}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"
              title="Refresh announcements"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/40"
            >
              <Plus className="h-5 w-5" />
              Post Update
            </button>
          </div>
        </div>
      </div>"""

if old_header not in text:
    raise SystemExit("❌ Could not find exact header block. No changes written.")

text = text.replace(old_header, new_header, 1)


# ─────────────────────────────────────────────────────────────────────────────
# 5. Small state-copy upgrades.
# ─────────────────────────────────────────────────────────────────────────────

text = text.replace("Loading comms array...", "Loading broadcast feed...", 1)
text = text.replace(
    "It's quiet here. Post your first high-signal update to align the team.",
    "No broadcasts yet. Post the first high-signal update so the team knows what changed, what matters, and what happens next.",
    1,
)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Upgrade modal visual frame.
# ─────────────────────────────────────────────────────────────────────────────

old_modal = """      {showCreate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} aria-label="Close" />
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30"><Megaphone className="w-6 h-6 text-white" /></div>
                <div><h2 className="text-xl font-black text-slate-900">Post Announcement</h2><p className="text-sm font-medium text-slate-500">Visible to all project members</p></div>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2.5 rounded-xl hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-900"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Type Category</label>
                <div className="flex gap-3 mt-3">
                  {['info', 'warning', 'success', 'urgent'].map(t => (
                    <button key={t} onClick={() => setType(t)} className={`px-4 py-2.5 rounded-xl text-sm font-bold capitalize transition-all border-2 ${type === t ? `${TYPE_STYLES[t].bg} ${TYPE_STYLES[t].border} ${TYPE_STYLES[t].text} shadow-sm` : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}>
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${TYPE_STYLES[t].dot} mr-2`} />{t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Headline <span className="text-rose-500">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="The bottom line up front..." maxLength={200} autoFocus className="mt-2 w-full px-4 py-3.5 rounded-xl text-lg font-black bg-slate-50 border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 transition-all" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Details <span className="text-rose-500">*</span></label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Expand on the context here..." rows={6} maxLength={5000} className="mt-2 w-full px-4 py-3.5 rounded-xl text-base font-medium resize-none bg-slate-50 border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 transition-all" />
              </div>

              <AttachmentInput uploadedFiles={uploadedFiles} onFilesChange={setUploadedFiles} />

              <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                <span className="text-sm font-bold text-slate-700">Pin to top of feed</span>
              </label>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-4">
              <button onClick={() => setShowCreate(false)} className="px-6 py-3 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm">Cancel</button>
              <button onClick={handleCreate} disabled={!title.trim() || !message.trim() || posting || anyUploading} className="px-8 py-3 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 flex items-center gap-2">
                {posting ? 'Transmitting...' : anyUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Send className="w-4 h-4" /> Broadcast Update</>}
              </button>
            </div>
          </div>
        </div>
      )}"""

new_modal = """      {showCreate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-md transition-opacity hover:bg-slate-950/50"
            onClick={() => setShowCreate(false)}
            aria-label="Close"
          />

          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl shadow-slate-950/30">
            <div className="relative overflow-hidden border-b border-slate-200 bg-white">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(124,58,237,0.16),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(20,184,166,0.10),transparent_32%)]" />

              <div className="relative flex items-center justify-between gap-4 px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-violet-600 shadow-xl shadow-violet-500/30">
                    <Megaphone className="h-6 w-6 text-white" />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-700">
                      Team Broadcast
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                      Post Announcement
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Visible to all project members
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-2xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="space-y-6 overflow-y-auto p-8">
              <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
                <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
                  Type Category
                </label>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {['info', 'warning', 'success', 'urgent'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-black capitalize transition-all ${
                        type === t
                          ? `${TYPE_STYLES[t].chip} shadow-sm ring-4 ${TYPE_STYLES[t].ring}`
                          : 'border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${TYPE_STYLES[t].dot}`} />
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
                  Headline <span className="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="The bottom line up front..."
                  maxLength={200}
                  autoFocus
                  className="mt-2 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-4 text-lg font-black text-slate-950 placeholder-slate-400 transition-all focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
                  Details <span className="text-rose-500">*</span>
                </label>

                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Expand on the context here..."
                  rows={6}
                  maxLength={5000}
                  className="mt-2 w-full resize-none rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium leading-7 text-slate-900 placeholder-slate-400 transition-all focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                />
              </div>

              <AttachmentInput uploadedFiles={uploadedFiles} onFilesChange={setUploadedFiles} />

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-amber-200 hover:bg-amber-50/60">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Pin className="h-4 w-4" />
                  </span>

                  <div>
                    <span className="block text-sm font-black text-slate-800">
                      Pin to top of feed
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Use this for decisions, warnings, or must-read updates.
                    </span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={e => setPinned(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-4 border-t border-slate-200 bg-slate-50 px-6 py-5">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={handleCreate}
                disabled={!title.trim() || !message.trim() || posting || anyUploading}
                className="flex items-center gap-2 rounded-2xl bg-violet-600 px-8 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {posting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Transmitting...
                  </>
                ) : anyUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Broadcast Update
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}"""

if old_modal not in text:
    raise SystemExit("❌ Could not find exact create-modal block. No changes written.")

text = text.replace(old_modal, new_modal, 1)


# ─────────────────────────────────────────────────────────────────────────────
# 7. Final safety checks.
# ─────────────────────────────────────────────────────────────────────────────

required_after = [
    "Signal Board",
    "Team Broadcast",
    "Pinned Broadcast",
    "Broadcast high-signal updates, decisions, warnings",
    "No broadcasts yet.",
    "function AnnouncementCard",
    "function AttachmentGallery",
    "export default function AnnouncementsView",
    "toggleAnnouncementPin",
    "deleteAnnouncement",
    "toggleLike",
    "addComment",
]

for marker in required_after:
    if marker not in text:
        raise SystemExit(f"❌ Safety check failed: missing `{marker}` after patch. No changes written.")

if text.count("function AnnouncementCard") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementCard count is not exactly 1. No changes written.")

if text.count("function AttachmentGallery") != 1:
    raise SystemExit("❌ Safety check failed: AttachmentGallery count is not exactly 1. No changes written.")

if text.count("export default function AnnouncementsView") != 1:
    raise SystemExit("❌ Safety check failed: default export count is not exactly 1. No changes written.")

path.write_text(text)

print("✅ AnnouncementsView.jsx visual refinement complete.")
print("✅ Backend untouched.")
print("✅ Existing API/data behavior preserved.")
print("✅ Upgraded: header command panel, announcement cards, attachment image frame, and create modal.")
print("✅ Next: run npm run build or npm run dev.")
