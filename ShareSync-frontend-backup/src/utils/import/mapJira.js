// src/utils/import/mapJira.js

import { normalizeDueDate } from "./mapLinear"; // reuse the same helper

function getAssigneeId(issue, opts = {}) {
  const fields = issue?.fields || {};
  const name =
    fields?.assignee?.displayName ||
    issue?.assignee?.displayName ||
    fields?.assignee?.name ||
    issue?.assignee?.name ||
    "";
  const email =
    fields?.assignee?.emailAddress ||
    issue?.assignee?.emailAddress ||
    "";

  if (typeof opts.resolveUserId === "function") {
    const via = opts.resolveUserId(email || name);
    if (via) return via;
  }
  return email || "";
}

function getLabels(issue) {
  const fields = issue?.fields || {};
  const arr =
    fields?.labels ||
    issue?.labels ||
    fields?.components ||
    [];
  if (Array.isArray(arr)) {
    return arr
      .map((x) =>
        typeof x === "string" ? x : (x?.name || null)
      )
      .filter(Boolean);
  }
  return [];
}

/**
 * Map a single Jira issue (cloud/server) into the import DTO:
 * { title, dueDate?, assigneeId?, labels? }
 *
 * @param {object} issue - Typically { id, key, fields: { summary, duedate, assignee, labels } }
 * @param {object} [opts]
 * @param {(nameOrEmail:string)=>string|undefined} [opts.resolveUserId]
 */
export default function mapJira(issue, opts = {}) {
  const fields = issue?.fields || {};
  const title =
    fields?.summary ||
    issue?.summary ||
    issue?.title ||
    "Untitled";

  const due =
    fields?.duedate ||
    fields?.dueDate ||
    issue?.due ||
    "";

  const dto = { title: String(title).trim() || "Untitled" };

  const dueDate = normalizeDueDate(due);
  if (dueDate) dto.dueDate = dueDate;

  const assigneeId = getAssigneeId(issue, opts);
  if (assigneeId) dto.assigneeId = assigneeId;

  const labels = getLabels(issue);
  if (labels.length) dto.labels = labels;

  return dto;
}

/**
 * Map a list of Jira issues.
 * @param {Array<object>} issues
 * @param {object} [opts]
 */
export function mapJiraList(issues = [], opts = {}) {
  return issues.map((it) => mapJira(it, opts));
}
