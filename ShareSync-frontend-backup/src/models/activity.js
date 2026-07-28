// Central activity model + normalizer used by feeds, sockets, and lists.

// -----------------------------
// Activity Types (authoritative)
// -----------------------------
export const ActivityTypes = /** @type {const} */ ({
    TASK_CREATED:      "task.created",
    TASK_UPDATED:      "task.updated",
    UPDATE_POSTED:     "update.posted",
    FILE_UPLOADED:     "file.uploaded",
    MEMBER_ADDED:      "project.member.added",
    MEMBER_REMOVED:    "project.member.removed",
    PROJECT_RENAMED:   "project.renamed",
    STATUS_CHANGED:    "project.status.changed",
  });
  
  /**
   * @typedef {Object} ActivityActor
   * @property {string} id
   * @property {string} name
   * @property {string=} avatarUrl
   */
  
  /**
   * @typedef {Object} ActivityProjectRef
   * @property {string} id
   * @property {string} name
   */
  
  /**
   * @typedef {Object} ActivityEntityRef
   * @property {string} type          // 'task' | 'update' | 'file' | 'project' | ...
   * @property {string} id
   * @property {string=} title
   */
  
  /**
   * @typedef {Object} ActivityAttachment
   * @property {string} id
   * @property {'image'|'file'} kind
   * @property {string} url
   * @property {string=} thumbUrl
   * @property {string=} name
   * @property {number=} size
   * @property {string=} mime
   */
  
  /**
   * Canonical Activity shape used across the app.
   * @typedef {Object} Activity
   * @property {string} id
   * @property {keyof typeof ActivityTypes | string} type
   * @property {ActivityActor} user
   * @property {ActivityProjectRef} project
   * @property {ActivityEntityRef=} entity
   * @property {string=} message     // human-friendly summary from server (optional)
   * @property {ActivityAttachment[]=} attachments
 * @property {Object=} payload
 * @property {Object=} details
 * @property {Object=} metadata
 * @property {string=} action
   * @property {string} ts           // ISO timestamp
   * @property {boolean=} __optimistic // client-only flag for pending events
   */
  
  // -----------------------------
  // Normalization helpers
  // -----------------------------
  
  /** Return a string or empty. */
  const s = (v, def = "") => (typeof v === "string" && v.trim() ? v : def);
  
  /** Ensures attachments are in a consistent shape. */
  export function normalizeAttachments(list) {
    if (!Array.isArray(list)) return [];
    return list
      .map((a) => {
        if (!a) return null;
        const url = s(a.url);
        const kind = a.kind || (s(a.mime).startsWith("image/") ? "image" : "file");
        const id = s(a.id) || s(a._id) || `${kind}-${Math.random().toString(36).slice(2, 8)}`;
        if (!url) return null;
        return {
          id,
          kind: kind === "image" ? "image" : "file",
          url,
          thumbUrl: s(a.thumbUrl),
          name: s(a.name),
          size: Number.isFinite(a.size) ? a.size : undefined,
          mime: s(a.mime),
        };
      })
      .filter(Boolean);
  }
  
  /**
   * Normalize any backend/socket activity into our canonical shape.
   * Safe to call on optimistic client events too.
   * @param {any} raw
   * @returns {Activity}
   */
  export function normalizeActivity(raw) {
    if (!raw || typeof raw !== "object") {
      throw new Error("normalizeActivity: invalid input");
    }
  
    // ID
    const id =
      s(raw.id) ||
      s(raw._id) ||
      s(raw.activityId) ||
      (raw.__optimistic ? `tmp-${Date.now()}` : "");
  
    // Type
    const type = s(raw.type) || inferType(raw);
  
    // User
    const user = {
      id: s(raw.user?.id) || s(raw.userId) || s(raw.actor?.id) || "unknown",
      name:
        s(raw.user?.name) ||
        s(raw.actor?.name) ||
        s(raw.user?.username) ||
        "Someone",
      avatarUrl: s(raw.user?.avatarUrl),
    };
  
    // Project
    const project = {
      id:
        s(raw.project?.id) ||
        s(raw.projectId) ||
        s(raw.project?._id) ||
        "unknown",
      name: s(raw.project?.name) || s(raw.projectName) || "Project",
    };
  
    // Entity (optional)
    const entity = raw.entity
      ? {
          type: s(raw.entity.type) || guessEntityType(type),
          id: s(raw.entity.id) || s(raw.entity._id) || "",
          title: s(raw.entity.title) || s(raw.entity.name),
        }
      : buildEntityFromRaw(raw, type);
  
    // Message
    const message = s(raw.message);
  
    // Attachments
    const attachments = normalizeAttachments(raw.attachments);

    // Preserve task-mutation context for detailed timelines.
    const rawPayload =
      raw.payload && typeof raw.payload === "object"
        ? raw.payload
        : {};
    const rawDetails =
      raw.details && typeof raw.details === "object"
        ? raw.details
        : {};
    const rawMetadata =
      raw.metadata && typeof raw.metadata === "object"
        ? raw.metadata
        : {};
    const action = s(raw.action);
  
    // Timestamp
    const ts =
      s(raw.ts) ||
      s(raw.createdAt) ||
      s(raw.timestamp) ||
      new Date().toISOString();
  
    const cleaned = /** @type {Activity} */ ({
      id,
      type,
      user,
      project,
      entity,
      message,
      attachments,
      payload: rawPayload,
      details: rawDetails,
      metadata: rawMetadata,
      action,
      ts,
      __optimistic: !!raw.__optimistic,
    });
  
    // Final pass: ensure required fields
    if (!cleaned.id) cleaned.id = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if (!cleaned.type) cleaned.type = "unknown";
    if (!cleaned.project.id) cleaned.project.id = "unknown";
  
    return cleaned;
  }
  
  /** Guess an entity type from the activity type. */
  function guessEntityType(type) {
    if (!type) return "project";
    if (type.startsWith("task.")) return "task";
    if (type.startsWith("update.")) return "update";
    if (type.startsWith("file.")) return "file";
    if (type.startsWith("project.")) return "project";
    return "project";
  }
  
  /** Infer a type if server omitted it, based on fields present. */
  function inferType(raw) {
    if (raw?.task || raw?.taskId) return ActivityTypes.TASK_CREATED;
    if (raw?.file || raw?.fileId) return ActivityTypes.FILE_UPLOADED;
    if (raw?.text || raw?.update || raw?.updateId) return ActivityTypes.UPDATE_POSTED;
    return "unknown";
  }
  
  /** Build an entity object from common server shapes. */
  function buildEntityFromRaw(raw, type) {
    if (raw.task) {
      return { type: "task", id: s(raw.task.id) || s(raw.task._id) || "", title: s(raw.task.title) };
    }
    if (raw.file) {
      return { type: "file", id: s(raw.file.id) || s(raw.file._id) || "", title: s(raw.file.name) };
    }
    if (raw.update) {
      return { type: "update", id: s(raw.update.id) || s(raw.update._id) || "", title: s(raw.update.title) };
    }
    return { type: guessEntityType(type), id: s(raw.entityId), title: s(raw.title) || s(raw.name) };
  }
  
  // -----------------------------
  // Presentation helpers
  // -----------------------------
  
  /**
   * Produce a compact, human-readable line for ActivityList.
   * The server can also send `message`; this is a fallback.
   * @param {Activity} a
   */
  export function summarizeActivity(a) {
    if (a.message) return a.message;
  
    const who = a.user?.name || "Someone";
    const proj = a.project?.name ? ` in ${a.project.name}` : "";
    const what = (() => {
      switch (a.type) {
        case ActivityTypes.TASK_CREATED:
          return `created a task${a.entity?.title ? ` “${a.entity.title}”` : ""}`;
        case ActivityTypes.TASK_UPDATED:
          return `updated a task${a.entity?.title ? ` “${a.entity.title}”` : ""}`;
        case ActivityTypes.UPDATE_POSTED:
          return "posted an update";
        case ActivityTypes.FILE_UPLOADED:
          return `uploaded ${a.attachments?.length || 1} file(s)`;
        case ActivityTypes.MEMBER_ADDED:
          return "added a member";
        case ActivityTypes.MEMBER_REMOVED:
          return "removed a member";
        case ActivityTypes.PROJECT_RENAMED:
          return "renamed the project";
        default:
          return "did something";
      }
    })();
  
    return `${who} ${what}${proj}`;
  }
  
  /** Quick type guard. */
  export function isActivity(x) {
    return !!x && typeof x === "object" && typeof (x.id || x._id) !== "undefined";
  }
  