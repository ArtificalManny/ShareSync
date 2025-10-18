// src/utils/import/mapLinear.js

/**
 * Normalize a date-like value to YYYY-MM-DD (ISO local date) or return ''.
 * Accepts ISO strings, Date, or anything the Date ctor can parse.
 */
export function normalizeDueDate(input) {
    if (!input) return "";
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return "";
    // Return local-date ISO (YYYY-MM-DD)
    return d.toISOString().slice(0, 10);
  }
  
  /**
   * Extract a best-guess assignee id from common Linear shapes.
   * @param {object} issue
   * @param {object} [opts]
   * @param {(nameOrEmail:string)=>string|undefined} [opts.resolveUserId] - optional resolver
   */
  function getAssigneeId(issue, opts = {}) {
    const name =
      issue?.assignee?.name ||
      issue?.assignee?.displayName ||
      issue?.assigneeName ||
      issue?.assignee_full_name ||
      "";
    const email =
      issue?.assignee?.email ||
      issue?.assigneeEmail ||
      "";
  
    if (typeof opts.resolveUserId === "function") {
      const via = opts.resolveUserId(email || name);
      if (via) return via;
    }
    // If backend will match by email later, you can place the email in this field.
    if (email) return email;
    return "";
  }
  
  /**
   * Extract label strings from common Linear shapes.
   */
  function getLabels(issue) {
    const arr =
      issue?.labels ||
      issue?.labelIds ||
      issue?.tags ||
      [];
    if (Array.isArray(arr)) {
      // Linear often returns [{name,...}], but also ids; filter strings/objects
      return arr
        .map((x) => (typeof x === "string" ? x : x?.name))
        .filter(Boolean);
    }
    return [];
  }
  
  /**
   * Map a single Linear issue into the import DTO:
   * { title, dueDate?, assigneeId?, labels? }
   *
   * Tolerant to various shapes (REST/GraphQL/your proxy).
   * @param {object} issue
   * @param {object} [opts]
   * @param {(nameOrEmail:string)=>string|undefined} [opts.resolveUserId]
   * @returns {{ title: string, dueDate?: string, assigneeId?: string, labels?: string[] }}
   */
  export default function mapLinear(issue, opts = {}) {
    const title =
      issue?.title ||
      issue?.name ||
      issue?.summary ||
      "Untitled";
  
    const due =
      issue?.dueDate ||
      issue?.due ||
      issue?.targetDate ||
      "";
  
    const dto = {
      title: String(title).trim() || "Untitled",
    };
  
    const dueDate = normalizeDueDate(due);
    if (dueDate) dto.dueDate = dueDate;
  
    const assigneeId = getAssigneeId(issue, opts);
    if (assigneeId) dto.assigneeId = assigneeId;
  
    const labels = getLabels(issue);
    if (labels.length) dto.labels = labels;
  
    return dto;
  }
  
  /**
   * Map a list of Linear issues.
   * @param {Array<object>} issues
   * @param {object} [opts]
   */
  export function mapLinearList(issues = [], opts = {}) {
    return issues.map((it) => mapLinear(it, opts));
  }
  