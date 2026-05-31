from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/suggestions/SuggestionCard.jsx")

text = FILE_PATH.read_text()
backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + ".backup-current-user-avatar-fallback-" + datetime.now().strftime("%Y%m%d-%H%M%S")
)
backup_path.write_text(text)

# 1. Add useAuth import
old_import = "import { toast } from '../ui/toast';\n"
new_import = "import { toast } from '../ui/toast';\nimport { useAuth } from '../../contexts/AuthContext';\n"

if "useAuth" not in text:
    if old_import not in text:
        raise RuntimeError("Could not find toast import anchor. No changes were written.")
    text = text.replace(old_import, new_import, 1)

# 2. Add current user inside component
old_state_block = """const SuggestionCard = ({ suggestion, onVote, onImplement, canImplement = false, onClick }) => {
  const [voted, setVoted] = useState(false);
  const [implementing, setImplementing] = useState(false);
"""

new_state_block = """const SuggestionCard = ({ suggestion, onVote, onImplement, canImplement = false, onClick }) => {
  const { user } = useAuth();
  const [voted, setVoted] = useState(false);
  const [implementing, setImplementing] = useState(false);
"""

if old_state_block not in text:
    raise RuntimeError("Could not find component state block. No changes were written.")

if "const { user } = useAuth();" not in text:
    text = text.replace(old_state_block, new_state_block, 1)

# 3. Replace avatar URL block with current-user fallback
old_avatar_block = """  const authorAvatarUrl =
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

new_avatar_block = """  const authorIdValue =
    authorSource._id ||
    authorSource.id ||
    suggestion.authorId?._id ||
    suggestion.authorId?.id ||
    suggestion.authorId ||
    suggestion.author?.id ||
    suggestion.author?._id ||
    '';

  const currentUserId = user?._id || user?.id || '';
  const currentUserEmail = user?.email || '';

  const isCurrentUserAuthor =
    (authorIdValue && currentUserId && String(authorIdValue) === String(currentUserId)) ||
    (authorSource.email && currentUserEmail && String(authorSource.email).toLowerCase() === String(currentUserEmail).toLowerCase()) ||
    (authorName && user?.firstName && authorName.toLowerCase() === (user.firstName + ' ' + (user.lastName || '')).trim().toLowerCase());

  const currentUserAvatarUrl =
    user?.profilePicture ||
    user?.avatarUrl ||
    user?.avatar ||
    user?.photoUrl ||
    user?.imageUrl ||
    null;

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
    (isCurrentUserAuthor ? currentUserAvatarUrl : null) ||
    null;
"""

if old_avatar_block not in text:
    raise RuntimeError("Could not find authorAvatarUrl block. No changes were written.")

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

print("SuggestionCard current-user avatar fallback patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Imported useAuth")
print("- Added logged-in user avatar fallback when the suggestion author is the current user")
print("- Kept all voting, implementing, clicking, and rendering logic intact")
