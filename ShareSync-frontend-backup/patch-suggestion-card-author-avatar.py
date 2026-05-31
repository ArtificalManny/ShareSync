from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/suggestions/SuggestionCard.jsx")

text = FILE_PATH.read_text()
backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + ".backup-author-avatar-" + datetime.now().strftime("%Y%m%d-%H%M%S")
)
backup_path.write_text(text)

old_author_block = """  // Author display
  const authorInitial = suggestion.authorId?.firstName?.[0] || suggestion.author?.name?.[0] || '?';
  const authorName = suggestion.authorId?.firstName
    ? (suggestion.authorId.firstName + ' ' + (suggestion.authorId.lastName || '')).trim()
    : (suggestion.author?.name || 'Unknown');
"""

new_author_block = """  // Author display
  const authorSource = suggestion.authorId || suggestion.author || suggestion.createdBy || suggestion.user || {};

  const authorName = authorSource.firstName
    ? (authorSource.firstName + ' ' + (authorSource.lastName || '')).trim()
    : (authorSource.name || authorSource.username || suggestion.author?.name || 'Unknown');

  const authorInitial = authorName?.trim()?.[0]?.toUpperCase() || '?';

  const authorAvatarUrl =
    authorSource.profilePicture ||
    authorSource.avatarUrl ||
    authorSource.avatar ||
    authorSource.photoUrl ||
    authorSource.imageUrl ||
    suggestion.authorId?.profilePicture ||
    suggestion.authorId?.avatarUrl ||
    suggestion.authorId?.avatar ||
    suggestion.authorId?.photoUrl ||
    suggestion.author?.profilePicture ||
    suggestion.author?.avatarUrl ||
    suggestion.author?.avatar ||
    suggestion.author?.photoUrl ||
    null;
"""

old_avatar_block = """        <div className="flex items-center gap-2 mt-3">
          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/[0.08] flex items-center justify-center text-[10px] font-medium text-slate-600 dark:text-white/50">
            {authorInitial}
          </div>
          <span className="text-xs text-slate-600 dark:text-white/50">{authorName}</span>
"""

new_avatar_block = """        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 dark:bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-white/50 ring-1 ring-white/80 dark:ring-white/[0.08] shadow-sm shrink-0">
            {authorAvatarUrl ? (
              <img
                src={authorAvatarUrl}
                alt={authorName}
                className="h-full w-full object-cover"
                onError={function(e) {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.textContent = authorInitial;
                  }
                }}
              />
            ) : (
              authorInitial
            )}
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-white/50">{authorName}</span>
"""

if old_author_block not in text:
    raise RuntimeError("Could not find the author display block. No changes were written.")

if old_avatar_block not in text:
    raise RuntimeError("Could not find the author avatar JSX block. No changes were written.")

text = text.replace(old_author_block, new_author_block, 1)
text = text.replace(old_avatar_block, new_avatar_block, 1)

bad_patterns = [
    "onClick={() =",
    "onClick={() = className=",
    "className==",
]

for bad in bad_patterns:
    if bad in text:
        FILE_PATH.write_text(backup_path.read_text())
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

FILE_PATH.write_text(text)

print("SuggestionCard author avatar patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Author identity fallback logic")
print("- Author avatar rendering next to the suggestion author's name")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No suggestion fetching, filtering, sorting, voting, submitting, or implementing logic was changed.")
