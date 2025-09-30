// server/utils/email/services/ical.service.js
const Task = require('../models/Task');

function toDatePartsUTC(d) {
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()];
}

function pad(n) { return n.toString().padStart(2, '0'); }
function icsDate([Y, M, D, h = 0, m = 0]) {
  return `${Y}${pad(M)}${pad(D)}T${pad(h)}${pad(m)}00Z`;
}

async function buildProjectTasksICS(projectId) {
  const tasks = await Task.find({ projectId, dueDate: { $ne: null } })
    .sort({ dueDate: 1 })
    .lean();

  const lines = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//ShareSync//Tasks//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');

  const now = new Date();
  const dtstamp = icsDate(toDatePartsUTC(now));

  for (const t of tasks) {
    const due = new Date(t.dueDate);
    // all-day-ish due date at 09:00 UTC so it shows nicely; tune if needed
    const startParts = toDatePartsUTC(due); startParts[3] = 9; startParts[4] = 0;

    const uid = `${t._id}@sharesync`;
    const title = (t.title || 'Task').replace(/\n/g, ' ');
    const desc = `Status: ${t.status || 'unknown'}\\nSchedule: ${t.scheduleState || 'unknown'}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${icsDate(startParts)}`);
    lines.push(`SUMMARY:${escapeText(title)}`);
    lines.push(`DESCRIPTION:${escapeText(desc)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeText(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

module.exports = { buildProjectTasksICS };
