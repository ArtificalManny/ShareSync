from pathlib import Path

path = Path("src/api/follows.js")

if not path.exists():
    raise SystemExit(f"File not found: {path}")

text = path.read_text()

old_follow = """export async function followProject(projectId) {
  const id = encodeProjectId(projectId, 'followProject');

  try {
    const res = await client.post(`/follows/${id}`);
    return normalizeFollowMutationResult(res, true);
  } catch (err) {
    console.error('[follows] followProject failed:', err);
    throw err;
  }
}
"""

new_follow = """export async function followProject(projectId) {
  const id = encodeProjectId(projectId, 'followProject');

  try {
    const res = await client.post(`/follows/${id}`);
    return normalizeFollowMutationResult(res, true);
  } catch (primaryErr) {
    try {
      const fallbackRes = await client.post(`/projects/${id}/follow`);
      return normalizeFollowMutationResult(fallbackRes, true);
    } catch (fallbackErr) {
      console.error('[follows] followProject failed:', {
        primary: primaryErr?.response?.status || primaryErr?.message || primaryErr,
        fallback: fallbackErr?.response?.status || fallbackErr?.message || fallbackErr,
      });
      throw fallbackErr;
    }
  }
}
"""

old_unfollow = """export async function unfollowProject(projectId) {
  const id = encodeProjectId(projectId, 'unfollowProject');

  try {
    const res = await client.delete(`/follows/${id}`);
    return normalizeFollowMutationResult(res, false);
  } catch (err) {
    console.error('[follows] unfollowProject failed:', err);
    throw err;
  }
}
"""

new_unfollow = """export async function unfollowProject(projectId) {
  const id = encodeProjectId(projectId, 'unfollowProject');

  try {
    const res = await client.delete(`/follows/${id}`);
    return normalizeFollowMutationResult(res, false);
  } catch (primaryErr) {
    try {
      const fallbackRes = await client.delete(`/projects/${id}/follow`);
      return normalizeFollowMutationResult(fallbackRes, false);
    } catch (fallbackErr) {
      console.error('[follows] unfollowProject failed:', {
        primary: primaryErr?.response?.status || primaryErr?.message || primaryErr,
        fallback: fallbackErr?.response?.status || fallbackErr?.message || fallbackErr,
      });
      throw fallbackErr;
    }
  }
}
"""

if old_follow not in text:
    raise SystemExit("Could not find current followProject block.")

if old_unfollow not in text:
    raise SystemExit("Could not find current unfollowProject block.")

text = text.replace(old_follow, new_follow)
text = text.replace(old_unfollow, new_unfollow)

path.write_text(text)
print(f"Patched route fallback in {path}")
