from pathlib import Path
import shutil
from datetime import datetime
import re

path = Path("src/components/views/AnnouncementsView.jsx")
if not path.exists():
    raise FileNotFoundError(path)

backup = path.with_suffix(
    path.suffix + f".backup-before-force-load-like-normalization-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
shutil.copy2(path, backup)

text = path.read_text()

new_load = """  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAnnouncements(projectId);
      if (mountedRef.current) {
        const safeData = Array.isArray(data) ? data : [];
        setAnnouncements(
          safeData.map((announcement) =>
            normalizeAnnouncementLikeState(announcement, user)
          )
        );
      }
    } catch (e) {
      if (mountedRef.current) setError(e?.message || 'Failed to load');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [projectId, user]);"""

pattern = re.compile(
    r"  const load = useCallback\(async \(\) => \{\n"
    r"    if \(!projectId\) return;[\s\S]*?"
    r"  \}, \[projectId(?:, user)?\]\);",
    re.MULTILINE,
)

text, count = pattern.subn(new_load, text, count=1)

if count != 1:
    raise RuntimeError(
        "Could not replace the load() function. Run this and paste the output:\n"
        "grep -n -B 8 -A 25 \"const load = useCallback\" src/components/views/AnnouncementsView.jsx"
    )

# Also normalize newly-created announcements so they behave immediately after posting.
text = text.replace(
    "setAnnouncements(prev => [optimisticAnnouncement, ...prev]);",
    "setAnnouncements(prev => [normalizeAnnouncementLikeState(optimisticAnnouncement, user), ...prev]);",
)

path.write_text(text)

print("✅ Forced announcement load normalization applied.")
print(f"Updated: {path}")
print(f"Backup:  {backup}")
print("")
print("Verify:")
print("grep -n -B 8 -A 24 \"const load = useCallback\" src/components/views/AnnouncementsView.jsx")
print("grep -n \"normalizeAnnouncementLikeState(optimisticAnnouncement\" src/components/views/AnnouncementsView.jsx")
