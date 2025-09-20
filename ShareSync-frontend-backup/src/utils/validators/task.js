// src/utils/validators/task.js

/**
 * Task payload validator & normalizer for the FE.
 * Use before calling createTask / patchTask.
 */

export const TASK_STATUSES = ["Not Started", "In Progress", "Completed"];

/** Map common variants to our canonical statuses. */
export function canonicalizeStatus(s = "") {
  const v = String(s || "").trim().toLowerCase();
  if (["not started", "todo", "to do", "new"].includes(v)) return "Not Started";
  if (["in progress", "doing", "wip"].includes(v)) return "In Progress";
  if (["completed", "done", "complete"].includes(v)) return "Completed";
  return s;
}

/** Quick helper: did this task land in a "Completed" state? */
export const isCompleted = (t) =>
  canonicalizeStatus(t?.status || t) === "Completed";

/**
 * Normalize input into the shape our API expects.
 * - Trims strings
 * - Converts labels "a, b" -> ["a","b"]
 * - Normalizes status text
 * - Parses dueDate to ISO if valid (backend accepts Date)
 */
export function normalizeTaskPayload(input = {}, { allowPartial = false } = {}) {
  const out = {};

  if ("title" in input) out.title = String(input.title || "").trim();
  if ("status" in input) out.status = canonicalizeStatus(input.status);

  if ("assigneeId" in input) {
    const v = String(input.assigneeId ?? "").trim();
    if (v) out.assigneeId = v;
  }

  if ("dueDate" in input && input.dueDate) {
    const d = new Date(input.dueDate);
    out.dueDate = Number.isNaN(d.getTime()) ? String(input.dueDate) : d.toISOString();
  }

  if ("labels" in input) {
    if (Array.isArray(input.labels)) {
      out.labels = input.labels.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof input.labels === "string") {
      out.labels = input.labels
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  if ("notes" in input) out.notes = String(input.notes || "").trim();

  return out;
}

/**
 * Validate a task payload.
 * @param {object} input
 * @param {{isPatch?: boolean}} opts
 * @returns {{ ok: boolean, errors: Record<string,string>, value: object }}
 */
export function validateTaskPayload(input = {}, { isPatch = false } = {}) {
  const errors = {};
  const value = normalizeTaskPayload(input, { allowPartial: isPatch });

  // Title
  if (!isPatch) {
    if (!value.title) errors.title = "Title is required.";
  } else if ("title" in value && !value.title) {
    errors.title = "Title cannot be empty.";
  }
  if (value.title && value.title.length > 240) {
    errors.title = "Title must be 240 characters or fewer.";
  }

  // Status
  if ("status" in value) {
    if (!TASK_STATUSES.includes(value.status)) {
      errors.status = `Status must be one of: ${TASK_STATUSES.join(", ")}`;
    }
  }

  // Due date
  if ("dueDate" in value && value.dueDate) {
    const d = new Date(value.dueDate);
    if (Number.isNaN(d.getTime())) errors.dueDate = "Invalid date.";
  }

  // Labels
  if ("labels" in value && !Array.isArray(value.labels)) {
    errors.labels = "Labels must be an array of strings.";
  }

  return { ok: Object.keys(errors).length === 0, errors, value };
}
