// Tiny parser for @user, #project, and type:* tokens.

export function parseSearchTokens(q = "") {
    const s = String(q || "");
    const atUsers = Array.from(s.matchAll(/@([\w\-.]+)/g)).map(m => m[1]);
    const hashProjects = Array.from(s.matchAll(/#([\w\-.]+)/g)).map(m => m[1]);
    const typeTokens = Array.from(s.matchAll(/(?:^|\s)type:([a-z]+)/gi)).map(m => m[1].toLowerCase());
    return { atUsers, hashProjects, typeTokens };
  }
  
  /** Given incoming types array/string, return normalized unique array */
  export function normalizeTypes(types, allTypes) {
    const arr = Array.isArray(types)
      ? types
      : String(types || "").split(",").filter(Boolean);
    const uniq = Array.from(new Set(arr.map(t => String(t).toLowerCase())));
    return uniq.filter(t => allTypes.includes(t));
  }
  