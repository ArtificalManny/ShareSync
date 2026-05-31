from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")
if not path.exists():
    raise FileNotFoundError(path)

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-before-like-toggle-visual-{stamp}")
shutil.copy2(path, backup)

text = path.read_text()

def replace_once(needle, replacement, label):
    global text
    if needle not in text:
        raise RuntimeError(f"Could not find block: {label}\nBackup kept at: {backup}")
    text = text.replace(needle, replacement, 1)

# 1) Make local like toggling accept a forced liked/unliked state.
replace_once(
"""function toggleLocalAnnouncementLike(announcement, currentUser) {
  const currentUserId = getCurrentUserId(currentUser);
  if (!currentUserId) return announcement;

  const likes = Array.isArray(announcement?.likes) ? announcement.likes : [];
  const alreadyLiked = likes.some((like) => getLikeId(like) === currentUserId);

  return {
    ...announcement,
    likes: alreadyLiked
      ? likes.filter((like) => getLikeId(like) !== currentUserId)
      : [...likes, getLikeValueForCurrentUser(currentUser)],
  };
}
""",
"""function setLocalAnnouncementLike(announcement, currentUser, shouldLike) {
  const currentUserId = getCurrentUserId(currentUser);
  const likes = Array.isArray(announcement?.likes) ? announcement.likes : [];
  const alreadyLiked = currentUserId
    ? likes.some((like) => getLikeId(like) === currentUserId)
    : false;

  let nextLikes = likes;

  if (shouldLike && !alreadyLiked) {
    nextLikes = [...likes, getLikeValueForCurrentUser(currentUser)];
  }

  if (!shouldLike && alreadyLiked) {
    nextLikes = likes.filter((like) => getLikeId(like) !== currentUserId);
  }

  const currentCount =
    Number.isFinite(Number(announcement?._clientLikeCount))
      ? Number(announcement._clientLikeCount)
      : likes.length;

  const nextCount = shouldLike
    ? Math.max(currentCount, likes.length) + (alreadyLiked ? 0 : 1)
    : Math.max(0, currentCount - 1);

  return {
    ...announcement,
    likes: nextLikes,
    _clientHasLiked: shouldLike,
    _clientLikeCount: nextCount,
  };
}
""",
"replace toggleLocalAnnouncementLike with setLocalAnnouncementLike"
)

# 2) Make hasLiked and likeCount respect the client-safe fields.
replace_once(
"""  const likes = Array.isArray(item.likes) ? item.likes : [];
  const likeCount = likes.length;
  const hasLiked = likes.some((like) => getLikeId(like) === currentUserId);
""",
"""  const likes = Array.isArray(item.likes) ? item.likes : [];
  const serverHasLiked = likes.some((like) => getLikeId(like) === currentUserId);
  const hasLiked =
    typeof item._clientHasLiked === 'boolean'
      ? item._clientHasLiked
      : serverHasLiked;

  const likeCount =
    Number.isFinite(Number(item._clientLikeCount))
      ? Number(item._clientLikeCount)
      : likes.length;
""",
"hasLiked and likeCount visual fallback"
)

# 3) Replace handleLike with true toggle behavior.
replace_once(
"""  const handleLike = async () => {
    if (liking) return;

    const announcementId = getId(item);
    if (!announcementId) {
      toast({ title: 'Could not find announcement ID', variant: 'error' });
      return;
    }

    if (!currentUserId) {
      toast({ title: 'Please sign in to like announcements', variant: 'error' });
      return;
    }

    const previous = item;
    const optimistic = toggleLocalAnnouncementLike(item, currentUser);

    setLiking(true);
    onUpdate(optimistic);

    try {
      const response = await toggleLike(projectId, announcementId);
      const updated = unwrapAnnouncementPayload(response);

      if (updated && getId(updated)) {
        onUpdate(updated);
      }
    } catch (error) {
      onUpdate(previous);
      toast({
        title: error?.response?.data?.message || error?.message || 'Failed to like',
        variant: 'error',
      });
    } finally {
      setLiking(false);
    }
  };
""",
"""  const handleLike = async () => {
    if (liking) return;

    const announcementId = getId(item);
    if (!announcementId) {
      toast({ title: 'Could not find announcement ID', variant: 'error' });
      return;
    }

    if (!currentUserId) {
      toast({ title: 'Please sign in to like announcements', variant: 'error' });
      return;
    }

    const previous = item;
    const nextLiked = !hasLiked;
    const optimistic = setLocalAnnouncementLike(item, currentUser, nextLiked);

    setLiking(true);
    onUpdate(optimistic);

    try {
      const response = await toggleLike(projectId, announcementId);
      const updated = unwrapAnnouncementPayload(response);

      if (updated && getId(updated)) {
        const serverLikes = Array.isArray(updated.likes) ? updated.likes : [];
        onUpdate({
          ...updated,
          _clientHasLiked: nextLiked,
          _clientLikeCount: serverLikes.length,
        });
      }
    } catch (error) {
      onUpdate(previous);
      toast({
        title: error?.response?.data?.message || error?.message || 'Failed to update like',
        variant: 'error',
      });
    } finally {
      setLiking(false);
    }
  };
""",
"handleLike true toggle"
)

path.write_text(text)

print("✅ Announcement Like visual toggle fix applied.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- Like button fills immediately when you like")
print("- Like button reverts when you click again")
print("- Count updates optimistically")
print("- Backend response still syncs after the request finishes")
