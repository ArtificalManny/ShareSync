from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")
if not path.exists():
    raise FileNotFoundError(path)

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-before-like-fix-{stamp}")
shutil.copy2(path, backup)

text = path.read_text()

def replace_once(needle, replacement, label):
    global text
    if needle not in text:
        raise RuntimeError(f"Could not find block: {label}\nBackup kept at: {backup}")
    text = text.replace(needle, replacement, 1)

# 1) Add robust like/payload helpers after getId()
replace_once(
"""function getId(item) {
  return item?._id || item?.id || '';
}
""",
"""function getId(item) {
  return item?._id || item?.id || '';
}

function unwrapAnnouncementPayload(payload) {
  return (
    payload?.data?.announcement ||
    payload?.announcement ||
    payload?.data?.data ||
    payload?.data ||
    payload?.item ||
    payload
  );
}

function getCurrentUserId(user) {
  return String(
    user?.userId ||
    user?._id ||
    user?.id ||
    user?.sub ||
    ''
  );
}

function getLikeId(like) {
  return String(
    like?._id ||
    like?.id ||
    like?.userId?._id ||
    like?.userId?.id ||
    like?.userId ||
    like?.user?._id ||
    like?.user?.id ||
    like?.authorId?._id ||
    like?.authorId ||
    like ||
    ''
  );
}

function getLikeValueForCurrentUser(user) {
  return (
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.sub ||
    user
  );
}

function toggleLocalAnnouncementLike(announcement, currentUser) {
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
"like helper functions"
)

# 2) Make AnnouncementCard use robust current user id + robust hasLiked
replace_once(
"""  const currentUserId = String(currentUser?.userId || currentUser?._id || currentUser?.id || currentUser?.sub || '');
""",
"""  const currentUserId = getCurrentUserId(currentUser);
""",
"AnnouncementCard currentUserId"
)

replace_once(
"""  const hasLiked = likes.some(l => String(l?._id || l) === currentUserId);
""",
"""  const hasLiked = likes.some((like) => getLikeId(like) === currentUserId);
""",
"robust hasLiked check"
)

# 3) Replace handleLike with optimistic UI + backend sync + rollback
replace_once(
"""  const handleLike = async () => {
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
"handleLike"
)

# 4) Make parent handleUpdate understand wrapped backend responses
replace_once(
"""  const handleUpdate = (updated) => {
    if (!updated) return;
    const uid = getId(updated);
    setAnnouncements(prev => prev.map(a => getId(a) === uid ? updated : a));
  };
""",
"""  const handleUpdate = (payload) => {
    const updated = unwrapAnnouncementPayload(payload);
    if (!updated) return;

    const uid = getId(updated);
    if (!uid) {
      load();
      return;
    }

    setAnnouncements((prev) =>
      prev.map((announcement) =>
        getId(announcement) === uid
          ? { ...announcement, ...updated }
          : announcement
      )
    );
  };
""",
"handleUpdate"
)

path.write_text(text)

print("✅ Announcement Like button fix applied.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- Like updates instantly in the UI")
print("- Backend response wrappers are handled")
print("- Failed backend request rolls the UI back")
print("- Like ID matching now supports strings, user objects, userId objects, and _id/id variants")
