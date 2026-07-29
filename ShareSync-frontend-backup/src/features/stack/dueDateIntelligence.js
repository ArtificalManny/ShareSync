const DAY_MS = 24 * 60 * 60 * 1000;

const COMPLETE_STATUSES = new Set([
  "done",
  "complete",
  "completed",
  "closed",
  "archived",
]);

const CHIP_STYLES = Object.freeze({
  none:
    "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60 border-slate-200 dark:border-white/10",
  overdue:
    "bg-rose-100 dark:bg-red-500/10 text-rose-700 dark:text-red-300 border-rose-200 dark:border-red-500/20",
  today:
    "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/25",
  soon:
    "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
  scheduled:
    "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20",
});

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function parseCalendarDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return {
      year: value.getFullYear(),
      month: value.getMonth(),
      day: value.getDate(),
      date: new Date(
        value.getFullYear(),
        value.getMonth(),
        value.getDate()
      ),
    };
  }

  const raw = String(value).trim();

  if (!raw) return null;

  const datePrefix = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (datePrefix) {
    const year = Number(datePrefix[1]);
    const month = Number(datePrefix[2]) - 1;
    const day = Number(datePrefix[3]);

    const date = new Date(
      year,
      month,
      day
    );

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      return null;
    }

    return {
      year,
      month,
      day,
      date,
    };
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth(),
    day: parsed.getDate(),
    date: new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate()
    ),
  };
}

function calendarSerial(parts) {
  return Math.floor(
    Date.UTC(
      parts.year,
      parts.month,
      parts.day
    ) / DAY_MS
  );
}

function formatCalendarDate(parts) {
  const options = {
    month: "short",
    day: "numeric",
  };

  if (
    parts.year !==
    new Date().getFullYear()
  ) {
    options.year = "numeric";
  }

  return new Intl.DateTimeFormat(
    undefined,
    options
  ).format(parts.date);
}

export function isCompleteStatus(status) {
  return COMPLETE_STATUSES.has(
    normalizeStatus(status)
  );
}

export function getDueDateMeta(
  dueDate,
  status
) {
  const due = parseCalendarDate(dueDate);

  if (!due) {
    return {
      state: "none",
      label: "No due date",
      detail:
        "Add a due date to make urgency visible.",
      chip: CHIP_STYLES.none,
      daysUntilDue: null,
      isOverdue: false,
      isDueToday: false,
      isDueSoon: false,
      hasDueDate: false,
    };
  }

  const now = new Date();

  const today = {
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate(),
  };

  const daysUntilDue =
    calendarSerial(due) -
    calendarSerial(today);

  const formatted =
    formatCalendarDate(due);

  const complete =
    isCompleteStatus(status);

  if (
    !complete &&
    daysUntilDue < 0
  ) {
    const overdueDays =
      Math.abs(daysUntilDue);

    return {
      state: "overdue",
      label: `Overdue · ${formatted}`,
      detail:
        overdueDays === 1
          ? "1 day overdue"
          : `${overdueDays} days overdue`,
      chip: CHIP_STYLES.overdue,
      daysUntilDue,
      isOverdue: true,
      isDueToday: false,
      isDueSoon: false,
      hasDueDate: true,
    };
  }

  if (
    !complete &&
    daysUntilDue === 0
  ) {
    return {
      state: "today",
      label: "Due today",
      detail: `Due ${formatted}`,
      chip: CHIP_STYLES.today,
      daysUntilDue,
      isOverdue: false,
      isDueToday: true,
      isDueSoon: false,
      hasDueDate: true,
    };
  }

  if (
    !complete &&
    daysUntilDue >= 1 &&
    daysUntilDue <= 3
  ) {
    return {
      state: "soon",
      label: `Due soon · ${formatted}`,
      detail:
        daysUntilDue === 1
          ? "Due tomorrow"
          : `Due in ${daysUntilDue} days`,
      chip: CHIP_STYLES.soon,
      daysUntilDue,
      isOverdue: false,
      isDueToday: false,
      isDueSoon: true,
      hasDueDate: true,
    };
  }

  return {
    state: "scheduled",
    label: formatted,
    detail: complete
      ? `Completed Move · due ${formatted}`
      : `Due ${formatted}`,
    chip: CHIP_STYLES.scheduled,
    daysUntilDue,
    isOverdue: false,
    isDueToday: false,
    isDueSoon: false,
    hasDueDate: true,
  };
}
