export const DISALLOWED_EXT = ["exe","dmg","js","bat","cmd","sh"];
export const MAX_FILE_MB = 20;

export function extensionOf(name="") {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i+1).toLowerCase() : "";
}

export function basicClientChecks(file, {
  maxMb = MAX_FILE_MB,
  disallowedExt = DISALLOWED_EXT
} = {}) {
  const issues = [];
  if (!file) return ["File missing"];
  if (file.size > maxMb * 1024 * 1024) issues.push(`Too large (${(file.size/1024/1024).toFixed(1)} MB). Limit ${maxMb} MB.`);
  const ext = extensionOf(file.name);
  if (disallowedExt.includes(ext)) issues.push(`Blocked file type ".${ext}".`);
  if (!file.type) issues.push("Unknown file type.");
  return issues;
}
