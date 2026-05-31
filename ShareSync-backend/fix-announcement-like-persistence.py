from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/announcements/announcements.service.ts")
backup = path.with_suffix(path.suffix + f".backup-before-like-persistence-{datetime.now().strftime('%Y%m%d-%H%M%S')}")

text = path.read_text()
shutil.copy2(path, backup)

old = """    const likedBy = Array.isArray(doc.likedBy) ? doc.likedBy : [];

    const existingIndex = likedBy.findIndex(
      (id) => String(id) === String(userObjectId),
    );

    if (existingIndex >= 0) {
      likedBy.splice(existingIndex, 1);
    } else {
      likedBy.push(userObjectId);
    }

    doc.likedBy = likedBy;
    doc.likesCount = likedBy.length;
    doc.likes = likedBy.length;"""

new = """    // Canonical source of truth: `likes` is the persisted array of user ObjectIds.
    // Older frontend/backend code also referenced `likedBy`, so we safely migrate from it.
    const existingLikes = Array.isArray((doc as any).likes)
      ? [...(doc as any).likes]
      : Array.isArray((doc as any).likedBy)
        ? [...(doc as any).likedBy]
        : [];

    const existingIndex = existingLikes.findIndex(
      (id) => String(id) === String(userObjectId),
    );

    if (existingIndex >= 0) {
      existingLikes.splice(existingIndex, 1);
    } else {
      existingLikes.push(userObjectId);
    }

    // Persist the array, not just the count.
    (doc as any).likes = existingLikes;
    (doc as any).likedBy = existingLikes;
    (doc as any).likesCount = existingLikes.length;"""

if old not in text:
    raise RuntimeError("Could not find the backend toggleLike block. Paste lines 285-320 of src/announcements/announcements.service.ts")

text = text.replace(old, new, 1)
path.write_text(text)

print("✅ Backend announcement like persistence patched.")
print(f"Updated: {path}")
print(f"Backup:  {backup}")
