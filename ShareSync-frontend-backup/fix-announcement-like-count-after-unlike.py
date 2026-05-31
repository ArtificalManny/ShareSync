from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")
if not path.exists():
    raise FileNotFoundError(path)

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-before-like-count-unlike-{stamp}")
shutil.copy2(path, backup)

text = path.read_text()

old = """      if (updated && getId(updated)) {
        const serverLikes = Array.isArray(updated.likes) ? updated.likes : [];
        onUpdate({
          ...updated,
          _clientHasLiked: nextLiked,
          _clientLikeCount: serverLikes.length,
        });
      }
"""

new = """      if (updated && getId(updated)) {
        const serverLikes = Array.isArray(updated.likes) ? updated.likes : [];

        onUpdate({
          ...updated,

          // Keep the visual state aligned with the user's click.
          // The backend response may return a stale likes array or a user-id shape
          // that does not match the frontend's currentUserId check.
          likes: nextLiked
            ? serverLikes
            : serverLikes.filter((like) => getLikeId(like) !== currentUserId),

          _clientHasLiked: nextLiked,
          _clientLikeCount: optimistic._clientLikeCount,
        });
      }
"""

if old not in text:
    raise RuntimeError(
        "Could not find the stale serverLikes.length block. Run this and paste the output:\\n"
        "grep -n -B 8 -A 18 '_clientLikeCount' src/components/views/AnnouncementsView.jsx\\n"
        f"Backup kept at: {backup}"
    )

text = text.replace(old, new, 1)
path.write_text(text)

print("✅ Announcement unlike count fix applied.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- Unlike now keeps the optimistic count at 0 instead of snapping back to server likes.length")
print("- Like button state and count should now move together")
print("- Backend response is still accepted, but stale count no longer overrides the UI")
