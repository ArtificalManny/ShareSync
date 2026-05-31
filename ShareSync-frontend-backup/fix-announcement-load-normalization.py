from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")
if not path.exists():
    raise FileNotFoundError(path)

backup = path.with_suffix(path.suffix + f".backup-before-load-like-normalization-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(path, backup)

text = path.read_text()

old = """      const data = await getAnnouncements(projectId);
      if (mountedRef.current) setAnnouncements(Array.isArray(data) ? data : []);"""

new = """      const data = await getAnnouncements(projectId);
      const list = Array.isArray(data) ? data : [];

      if (mountedRef.current) {
        setAnnouncements(
          list.map((announcement) =>
            normalizeAnnouncementLikeState(announcement, user)
          )
        );
      }"""

if old not in text:
    raise RuntimeError(
        "Could not find the exact load/setAnnouncements block. Run:\n"
        "grep -n -B 10 -A 18 \"const data = await getAnnouncements\" src/components/views/AnnouncementsView.jsx"
    )

text = text.replace(old, new, 1)

old_dep = "  }, [projectId]);"
new_dep = "  }, [projectId, user]);"

if old_dep not in text:
    raise RuntimeError(
        "Could not find useCallback dependency block. Run:\n"
        "grep -n -B 5 -A 5 \"}, \\[projectId\" src/components/views/AnnouncementsView.jsx"
    )

text = text.replace(old_dep, new_dep, 1)

path.write_text(text)

print("✅ Announcement load normalization patched.")
print(f"Updated: {path}")
print(f"Backup:  {backup}")
print("")
print("Changed:")
print("- Announcements are normalized after fetch")
print("- Liked state can survive section/page changes if backend returns likedBy/likes")
print("- load() now tracks user identity")
