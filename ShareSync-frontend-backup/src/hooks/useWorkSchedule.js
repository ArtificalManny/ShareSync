const DEFAULT_WORKDAYS = [1, 2, 3, 4, 5]; // Mon-Fri
const DEFAULT_QUIET = { start: 22, end: 7 }; // 10pm–7am

export default function useWorkSchedule(workdays = DEFAULT_WORKDAYS, quietHours = DEFAULT_QUIET) {
  const isWorkday = (d = new Date()) => workdays.includes(d.getDay());

  const isQuiet = (d = new Date()) => {
    const h = d.getHours();
    const { start = DEFAULT_QUIET.start, end = DEFAULT_QUIET.end } = quietHours || {};
    if (start === end) return false;
    if (start < end) {
      // e.g. 20 -> 7 (not crossing midnight)
      return h >= start && h < end;
    } else {
      // crosses midnight: 22 -> 7
      return h >= start || h < end;
    }
  };

  const isInWorkWindow = (d = new Date()) => isWorkday(d) && !isQuiet(d);

  return { isWorkday, isQuiet, isInWorkWindow };
}
