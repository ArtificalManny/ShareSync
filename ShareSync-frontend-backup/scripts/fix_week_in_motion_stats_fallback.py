from pathlib import Path
import re

path = Path("src/components/home/WeekInMotion.jsx")

if not path.exists():
    raise SystemExit(f"File not found: {path}")

text = path.read_text()

pattern = re.compile(
    r"async function fetchWeeklyRhythm\(\) \{.*?\n\}",
    re.DOTALL,
)

replacement = """function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildFallbackWeekDays({ weeklyShips = 0, activeDays = 0 } = {}) {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const todayIndex = (new Date().getDay() + 6) % 7;

  const days = labels.map((day, index) => ({
    day,
    date: null,
    count: 0,
    isToday: index === todayIndex,
  }));

  const safeActiveDays = Math.max(0, Math.min(7, safeNumber(activeDays, 0)));
  const safeWeeklyShips = Math.max(0, safeNumber(weeklyShips, 0));

  if (safeWeeklyShips <= 0 || safeActiveDays <= 0) {
    return days;
  }

  const eligibleIndexes = [];
  for (let index = 0; index <= todayIndex && eligibleIndexes.length < safeActiveDays; index += 1) {
    eligibleIndexes.push(index);
  }

  while (eligibleIndexes.length < safeActiveDays && eligibleIndexes.length < 7) {
    const next = eligibleIndexes.length;
    if (!eligibleIndexes.includes(next)) eligibleIndexes.push(next);
    else break;
  }

  const perDay = Math.floor(safeWeeklyShips / eligibleIndexes.length);
  const remainder = safeWeeklyShips % eligibleIndexes.length;

  eligibleIndexes.forEach((dayIndex, position) => {
    days[dayIndex].count = perDay + (position < remainder ? 1 : 0);
  });

  return days;
}

function normalizeWeeklyRhythmPayload(rhythmPayload, statsPayload) {
  const rhythm = rhythmPayload && typeof rhythmPayload === "object" ? rhythmPayload : {};
  const stats = statsPayload && typeof statsPayload === "object" ? statsPayload : {};

  const weeklyShips = safeNumber(
    stats.weeklyShips ??
      stats.shipsThisWeek ??
      stats.shippedThisWeek ??
      rhythm.thisWeekTotal ??
      rhythm.weeklyShips,
    0
  );

  const activeDays = safeNumber(
    stats.activeDaysThisWeek ??
      stats.daysActiveThisWeek ??
      rhythm.activeDays,
    0
  );

  const lastWeekShips = safeNumber(
    stats.lastWeekShips ??
      stats.shipsLastWeek ??
      rhythm.lastWeekTotal,
    0
  );

  const rhythmDays = Array.isArray(rhythm.days) ? rhythm.days : [];
  const rhythmDayTotal = rhythmDays.reduce(
    (sum, day) => sum + safeNumber(day?.count, 0),
    0
  );

  const days =
    rhythmDays.length > 0 && (rhythmDayTotal > 0 || weeklyShips === 0)
      ? rhythmDays
      : buildFallbackWeekDays({
          weeklyShips,
          activeDays,
        });

  const momentum =
    weeklyShips >= 8 ? "strong" : weeklyShips > 0 ? "building" : "idle";

  const momentumLabel =
    rhythm.momentumLabel ||
    (weeklyShips >= 8 ? "Shipping" : weeklyShips > 0 ? "Building" : "Warming up");

  const insight =
    weeklyShips > 0
      ? `You shipped ${weeklyShips} item${weeklyShips === 1 ? "" : "s"} across ${activeDays} active day${activeDays === 1 ? "" : "s"} this week.`
      : rhythm.insight ||
        "Your weekly rhythm will appear here once you start shipping activity this week.";

  return {
    ...rhythm,
    days,
    thisWeekTotal: weeklyShips,
    weeklyShips,
    activeDays,
    totalDays: safeNumber(rhythm.totalDays, 7) || 7,
    lastWeekTotal: lastWeekShips,
    lastWeekShips,
    momentum,
    momentumLabel,
    insight,
  };
}

async function fetchWeeklyRhythm() {
  try {
    const [rhythmRes, statsRes] = await Promise.allSettled([
      client.get("/users/me/weekly-rhythm"),
      client.get("/users/me/stats"),
    ]);

    const rhythmPayload =
      rhythmRes.status === "fulfilled"
        ? rhythmRes.value?.data?.data || rhythmRes.value?.data || null
        : null;

    const statsPayload =
      statsRes.status === "fulfilled"
        ? statsRes.value?.data?.data || statsRes.value?.data || null
        : null;

    if (!rhythmPayload && !statsPayload) {
      return null;
    }

    return normalizeWeeklyRhythmPayload(rhythmPayload, statsPayload);
  } catch (err) {
    console.warn("[WeekInMotion] Fetch failed:", err?.message);
    return null;
  }
}"""

if "async function fetchWeeklyRhythm()" not in text:
    raise SystemExit("Could not find fetchWeeklyRhythm function.")

text = pattern.sub(replacement, text, count=1)

path.write_text(text)
print("Patched WeekInMotion to use /users/me/stats as authority.")
