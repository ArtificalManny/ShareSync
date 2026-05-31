from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")
backup = path.with_suffix(path.suffix + f".backup-before-like-normalization-{datetime.now().strftime('%Y%m%d-%H%M%S')}")

text = path.read_text()
shutil.copy2(path, backup)

anchor = """function setLocalAnnouncementLike(announcement, currentUser, shouldLike) {"""
helper = """function normalizeAnnouncementLikeState(announcement, currentUser) {
  const currentUserId = getCurrentUserId(currentUser);

  const likesArray = Array.isArray(announcement?.likes)
    ? announcement.likes
    : Array.isArray(announcement?.likedBy)
      ? announcement.likedBy
      : [];

  const hasLiked = currentUserId
    ? likesArray.some((like) => getLikeId(like) === currentUserId)
    : false;

  const countFromLikesCount = Number(announcement?.likesCount);
  const countFromNumericLikes = Number(announcement?.likes);

  const likeCount = Number.isFinite(countFromLikesCount)
    ? countFromLikesCount
    : Number.isFinite(countFromNumericLikes)
      ? countFromNumericLikes
      : likesArray.length;

  return {
    ...announcement,
    likes: likesArray,
    likedBy: likesArray,
    _clientHasLiked: hasLiked,
    _clientLikeCount: Math.max(0, likeCount),
  };
}

"""

if helper.strip() not in text:
    if anchor not in text:
        raise RuntimeError("Could not find setLocalAnnouncementLike anchor.")
    text = text.replace(anchor, helper + anchor, 1)

text = text.replace(
"""      if (mountedRef.current) setAnnouncements(Array.isArray(data) ? data : []);""",
"""      if (mountedRef.current) {
        const safeData = Array.isArray(data) ? data : [];
        setAnnouncements(safeData.map((announcement) => normalizeAnnouncementLikeState(announcement, user)));
      }""",
1
)

text = text.replace(
"""  }, [projectId]);""",
"""  }, [projectId, user]);""",
1
)

text = text.replace(
"""      setAnnouncements(prev => [optimisticAnnouncement, ...prev]);""",
"""      setAnnouncements(prev => [normalizeAnnouncementLikeState(optimisticAnnouncement, user), ...prev]);""",
1
)

text = text.replace(
"""    setAnnouncements((prev) =>
      prev.map((announcement) =>
        getId(announcement) === uid
          ? { ...announcement, ...updated }
          : announcement
      )
    );""",
"""    setAnnouncements((prev) =>
      prev.map((announcement) =>
        getId(announcement) === uid
          ? normalizeAnnouncementLikeState({ ...announcement, ...updated }, user)
          : announcement
      )
    );""",
1
)

text = text.replace(
"""  const likes = Array.isArray(item.likes) ? item.likes : [];""",
"""  const likes = Array.isArray(item.likes)
    ? item.likes
    : Array.isArray(item.likedBy)
      ? item.likedBy
      : [];""",
1
)

text = text.replace(
"""  const likeCount =
    Number.isFinite(Number(item._clientLikeCount))
      ? Number(item._clientLikeCount)
      : likes.length;""",
"""  const likeCount =
    Number.isFinite(Number(item._clientLikeCount))
      ? Number(item._clientLikeCount)
      : Number.isFinite(Number(item.likesCount))
        ? Number(item.likesCount)
        : Number.isFinite(Number(item.likes))
          ? Number(item.likes)
          : likes.length;""",
1
)

path.write_text(text)

print("✅ Frontend announcement like normalization patched.")
print(f"Updated: {path}")
print(f"Backup:  {backup}")
