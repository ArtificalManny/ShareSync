import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Crosshair,
  Flag,
  Layers3,

  Route,} from "lucide-react";

import {
  completeTask,
  fetchTaskDetail,
  updateTask,
} from "../../api/taskApi";

import MoveTaskDetailDrawer from "../stack/MoveTaskDetailDrawer";

const DAY_MS = 24 * 60 * 60 * 1000;
const LABEL_WIDTH = 320;
const MOVE_LABEL_WIDTH = 156;
const MOVE_LABEL_GAP = 8;

// flightpath-visual-polish-v1
// flightpath-density-polish-v2
// flightpath-marker-cleanup-v3

const ZOOM_LEVELS = {
  day: {
    label: "Day",
    pixelsPerDay: 42,
    paddingDays: 7,
    minimumSpanDays: 30,
    gridDays: 1,
  },
  week: {
    label: "Week",
    pixelsPerDay: 15,
    paddingDays: 21,
    minimumSpanDays: 90,
    gridDays: 7,
  },
  month: {
    label: "Month",
    pixelsPerDay: 4,
    paddingDays: 60,
    minimumSpanDays: 365,
    gridDays: 30,
  },
};

const STATUS_META = {
  backlog: {
    label: "Backlog",
    bar: "border-slate-300 bg-slate-200 text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-zinc-100",
    dot: "bg-slate-400",
  },
  todo: {
    label: "Ready",
    bar: "border-violet-300 bg-violet-200 text-violet-950 dark:border-violet-400/30 dark:bg-violet-500/30 dark:text-violet-100",
    dot: "bg-violet-500",
  },
  in_progress: {
    label: "In progress",
    bar: "border-cyan-300 bg-cyan-200 text-cyan-950 dark:border-cyan-400/30 dark:bg-cyan-500/30 dark:text-cyan-100",
    dot: "bg-cyan-500",
  },
  blocked: {
    label: "Blocked",
    bar: "border-rose-300 bg-rose-200 text-rose-950 dark:border-rose-400/30 dark:bg-rose-500/30 dark:text-rose-100",
    dot: "bg-rose-500",
  },
  done: {
    label: "Done",
    bar: "border-emerald-300 bg-emerald-200 text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-500/30 dark:text-emerald-100",
    dot: "bg-emerald-500",
  },
};

function normalizeId(value) {
  if (!value) return "";

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return String(
    value?._id ||
      value?.id ||
      value?.taskId ||
      value?.milestoneId ||
      ""
  );
}

function normalizeStatus(value) {
  const normalized = String(value || "todo")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (
    normalized === "complete" ||
    normalized === "completed"
  ) {
    return "done";
  }

  if (
    normalized === "active" ||
    normalized === "doing" ||
    normalized === "inprogress"
  ) {
    return "in_progress";
  }

  return normalized || "todo";
}

function getStatusMeta(value) {
  const status = normalizeStatus(value);

  return (
    STATUS_META[status] || {
      label: status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        ),
      bar: "border-slate-300 bg-slate-200 text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-zinc-100",
      dot: "bg-slate-400",
    }
  );
}

function parseCalendarDate(value) {
  if (!value) return null;

  let source = value;

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value)
  ) {
    source = `${value.slice(0, 10)}T12:00:00`;
  }

  const parsed = new Date(source);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    12,
    0,
    0,
    0
  );
}

function calendarStamp(date) {
  if (!date) return NaN;

  return Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function addDays(date, amount) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + amount,
    12,
    0,
    0,
    0
  );
}

function differenceInCalendarDays(from, to) {
  return Math.round(
    (calendarStamp(to) - calendarStamp(from)) /
      DAY_MS
  );
}

function earlierDate(left, right) {
  return calendarStamp(left) <= calendarStamp(right)
    ? left
    : right;
}

function laterDate(left, right) {
  return calendarStamp(left) >= calendarStamp(right)
    ? left
    : right;
}

function clamp(value, minimum, maximum) {
  return Math.min(
    maximum,
    Math.max(minimum, value)
  );
}

function formatShortDate(date) {
  if (!date) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatFullDate(date) {
  if (!date) return "";

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
  }).format(date);
}

function getMoveTitle(move) {
  return String(
    move?.title ||
      move?.name ||
      move?.summary ||
      "Untitled Move"
  );
}

function cleanMilestoneTitle(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "Untitled milestone";
  }

  return (
    raw
      .replace(
        /\s*[-–—·|]?\s*\d{4}-\d{2}-\d{2}(?:[T\s]\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?)?\s*$/i,
        ""
      )
      .replace(
        /\s*[-–—·|]?\s*(?:\d{1,2}\/\d{1,2}|[A-Za-z]{3,9}\s+\d{1,2}(?:st|nd|rd|th)?)(?:,?\s+\d{4})?\s+\d{1,2}:\d{2}\s*(?:am|pm)?\s*$/i,
        ""
      )
      .replace(
        /\s*[-–—·|]?\s*\d{1,2}:\d{2}\s*(?:am|pm)?\s*$/i,
        ""
      )
      .trim() ||
    raw
  );
}

function getMilestoneTitle(milestone) {
  return cleanMilestoneTitle(
    milestone?.title ||
      milestone?.name ||
      milestone?.label ||
      "Untitled milestone"
  );
}

function getMilestoneDate(milestone) {
  return parseCalendarDate(
    milestone?.targetDate ||
      milestone?.dueDate ||
      milestone?.date ||
      milestone?.endDate ||
      milestone?.completedAt
  );
}

function getMoveMilestoneId(move) {
  return normalizeId(
    move?.milestoneId ||
      move?.milestone?._id ||
      move?.milestone?.id ||
      move?.milestone
  );
}

function buildTimelineRange(
  moves,
  milestones,
  zoom
) {
  const config = ZOOM_LEVELS[zoom];
  const today = parseCalendarDate(new Date());
  const dates = [today];

  for (const move of moves) {
    const start = parseCalendarDate(move?.startDate);
    const due = parseCalendarDate(move?.dueDate);

    if (start) dates.push(start);
    if (due) dates.push(due);
  }

  for (const milestone of milestones) {
    const date = getMilestoneDate(milestone);

    if (date) dates.push(date);
  }

  let minimum = dates[0];
  let maximum = dates[0];

  for (const date of dates) {
    minimum = earlierDate(minimum, date);
    maximum = laterDate(maximum, date);
  }

  let start = addDays(
    minimum,
    -config.paddingDays
  );

  let end = addDays(
    maximum,
    config.paddingDays
  );

  const currentSpan =
    differenceInCalendarDays(start, end);

  if (currentSpan < config.minimumSpanDays) {
    const missing =
      config.minimumSpanDays - currentSpan;

    start = addDays(
      start,
      -Math.floor(missing / 2)
    );

    end = addDays(
      end,
      Math.ceil(missing / 2)
    );
  }

  return {
    start,
    end,
    today,
  };
}

function buildHeaderSegments(
  rangeStart,
  rangeEnd,
  zoom,
  pixelsPerDay
) {
  const segments = [];
  const endExclusive = addDays(rangeEnd, 1);
  let cursor = rangeStart;
  let safety = 0;

  while (
    calendarStamp(cursor) <
      calendarStamp(endExclusive) &&
    safety < 2000
  ) {
    safety += 1;

    let next;
    let label;
    let sublabel = "";

    if (zoom === "day") {
      next = addDays(cursor, 1);

      label = new Intl.DateTimeFormat(
        undefined,
        {
          weekday: "short",
        }
      ).format(cursor);

      sublabel = formatShortDate(cursor);
    } else if (zoom === "week") {
      next = addDays(cursor, 7);
      label = formatShortDate(cursor);
      sublabel = "Week";
    } else {
      next = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        1,
        12,
        0,
        0,
        0
      );

      label = formatMonth(cursor);
    }

    if (
      calendarStamp(next) >
      calendarStamp(endExclusive)
    ) {
      next = endExclusive;
    }

    const days = Math.max(
      1,
      differenceInCalendarDays(cursor, next)
    );

    segments.push({
      key: `${calendarStamp(cursor)}-${zoom}`,
      date: cursor,
      label,
      sublabel,
      width: days * pixelsPerDay,
    });

    cursor = next;
  }

  return segments;
}

function getMilestoneDisplayTooltip(item) {
  if (!item) return "";

  if (item.count === 1) {
    return `${item.title} · ${formatFullDate(
      item.date
    )}`;
  }

  const visibleTitles = item.records
    .slice(0, 5)
    .map((record) => record.title)
    .join("\n");

  const remaining =
    item.count - Math.min(5, item.count);

  return [
    `${item.count} milestones near ${formatShortDate(
      item.date
    )}`,
    visibleTitles,
    remaining > 0
      ? `+${remaining} more`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function FlightpathGuides({
  activeMilestonePoint,
  todayLeft,
  timelineWidth,
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {activeMilestonePoint ? (
        <div
          key={`guide-${activeMilestonePoint.key}`}
          className="absolute inset-y-0 z-[9] border-l border-dashed border-fuchsia-400/75 shadow-[0_0_10px_rgba(217,70,239,0.12)] dark:border-fuchsia-400/40"
          style={{
            left: clamp(
              activeMilestonePoint.left,
              0,
              timelineWidth
            ),
          }}
        />
      ) : null}

      <div
        className="absolute inset-y-0 z-10 border-l-2 border-cyan-500/80 shadow-[0_0_14px_rgba(6,182,212,0.25)]"
        style={{
          left: clamp(
            todayLeft,
            0,
            timelineWidth
          ),
        }}
      />
    </div>
  );
}

export default function FlightpathView({
  projectId,
  moves = [],
  milestones = [],
  members = [],
  readOnly = false,
} = {}) {
  const [zoom, setZoom] = useState("week");
  const [groupBy, setGroupBy] =
    useState("milestone");

  const [localMoves, setLocalMoves] =
    useState(() =>
      Array.isArray(moves) ? moves : []
    );

  const [
    hoveredMilestoneKey,
    setHoveredMilestoneKey,
  ] = useState(null);

  const [
    selectedMilestoneKey,
    setSelectedMilestoneKey,
  ] = useState(null);

  const activeMilestoneKey =
    hoveredMilestoneKey ||
    selectedMilestoneKey;

  const [selectedMove, setSelectedMove] =
    useState(null);

  const [
    selectedMoveLoading,
    setSelectedMoveLoading,
  ] = useState(false);

  const scrollerRef = useRef(null);

  const safeMilestones = useMemo(
    () =>
      Array.isArray(milestones)
        ? milestones
        : [],
    [milestones]
  );

  const safeMembers = useMemo(
    () =>
      Array.isArray(members) ? members : [],
    [members]
  );

  useEffect(() => {
    setLocalMoves(
      Array.isArray(moves) ? moves : []
    );
  }, [moves]);

  useEffect(() => {
    setHoveredMilestoneKey(null);
    setSelectedMilestoneKey(null);
  }, [zoom]);

  const milestoneRecords = useMemo(
    () =>
      safeMilestones.map(
        (milestone, index) => ({
          milestone,
          id:
            normalizeId(milestone) ||
            `milestone-${index}`,
          title: getMilestoneTitle(milestone),
          date: getMilestoneDate(milestone),
          order: index,
        })
      ),
    [safeMilestones]
  );

  const milestoneById = useMemo(() => {
    const map = new Map();

    for (const record of milestoneRecords) {
      map.set(record.id, record);
    }

    return map;
  }, [milestoneRecords]);

  const timelineRange = useMemo(
    () =>
      buildTimelineRange(
        localMoves,
        safeMilestones,
        zoom
      ),
    [localMoves, safeMilestones, zoom]
  );

  const zoomConfig = ZOOM_LEVELS[zoom];
  const timelineDays = Math.max(
    1,
    differenceInCalendarDays(
      timelineRange.start,
      timelineRange.end
    ) + 1
  );

  const timelineWidth = Math.max(
    900,
    timelineDays *
      zoomConfig.pixelsPerDay
  );

  const positionForDate = useCallback(
    (date) =>
      differenceInCalendarDays(
        timelineRange.start,
        date
      ) * zoomConfig.pixelsPerDay,
    [
      timelineRange.start,
      zoomConfig.pixelsPerDay,
    ]
  );

  const todayLeft = positionForDate(
    timelineRange.today
  );

  const milestonePoints = useMemo(() => {
    const sorted = milestoneRecords
      .filter((record) => record.date)
      .map((record) => ({
        ...record,
        left: positionForDate(record.date),
      }))
      .sort(
        (left, right) =>
          left.left - right.left
      );

    const laneRightEdges = [
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ];

    return sorted.map((record) => {
      const estimatedLabelWidth = clamp(
        record.title.length * 6.2 + 40,
        88,
        180
      );

      let lane = laneRightEdges.findIndex(
        (rightEdge) =>
          record.left > rightEdge + 12
      );

      if (lane < 0) {
        lane = laneRightEdges.indexOf(
          Math.min(...laneRightEdges)
        );
      }

      laneRightEdges[lane] =
        record.left +
        estimatedLabelWidth;

      return {
        ...record,
        lane,
      };
    });
  }, [milestoneRecords, positionForDate]);

  const milestoneDisplayItems = useMemo(() => {
    const clusterDistance =
      zoom === "month"
        ? 56
        : zoom === "week"
          ? 18
          : 0;

    if (clusterDistance === 0) {
      return milestonePoints.map((point) => ({
        key: `milestone-${point.id}`,
        type: "milestone",
        count: 1,
        left: point.left,
        date: point.date,
        title: point.title,
        lane: point.lane,
        records: [point],
      }));
    }

    const clusters = [];

    for (const point of milestonePoints) {
      const current =
        clusters[clusters.length - 1];

      if (
        !current ||
        point.left - current.lastLeft >
          clusterDistance
      ) {
        clusters.push({
          firstLeft: point.left,
          lastLeft: point.left,
          records: [point],
        });

        continue;
      }

      current.records.push(point);
      current.lastLeft = point.left;
    }

    return clusters.map(
      (cluster, clusterIndex) => {
        const count = cluster.records.length;

        const left =
          cluster.records.reduce(
            (sum, record) =>
              sum + record.left,
            0
          ) / count;

        const first = cluster.records[0];
        const last =
          cluster.records[count - 1];

        return {
          key:
            count === 1
              ? `milestone-${first.id}`
              : `cluster-${zoom}-${clusterIndex}-${first.id}-${last.id}`,
          type:
            count === 1
              ? "milestone"
              : "cluster",
          count,
          left,
          date: first.date,
          title:
            count === 1
              ? first.title
              : `${count} milestones`,
          lane: 1,
          records: cluster.records,
        };
      }
    );
  }, [milestonePoints, zoom]);

  const activeMilestonePoint = useMemo(
    () =>
      milestoneDisplayItems.find(
        (item) =>
          item.key === activeMilestoneKey
      ) || null,
    [
      activeMilestoneKey,
      milestoneDisplayItems,
    ]
  );

  const headerSegments = useMemo(
    () =>
      buildHeaderSegments(
        timelineRange.start,
        timelineRange.end,
        zoom,
        zoomConfig.pixelsPerDay
      ),
    [
      timelineRange.start,
      timelineRange.end,
      zoom,
      zoomConfig.pixelsPerDay,
    ]
  );

  const groups = useMemo(() => {
    const groupMap = new Map();

    localMoves.forEach((move, index) => {
      let key;
      let label;
      let order;

      if (groupBy === "status") {
        const status =
          normalizeStatus(move?.status);

        key = `status-${status}`;
        label = getStatusMeta(status).label;

        order = {
          in_progress: 0,
          todo: 1,
          backlog: 2,
          blocked: 3,
          done: 4,
        }[status] ?? 20;
      } else {
        const milestoneId =
          getMoveMilestoneId(move);

        const milestone =
          milestoneById.get(milestoneId);

        key = milestoneId
          ? `milestone-${milestoneId}`
          : "milestone-none";

        label = milestone
          ? milestone.title
          : "No milestone";

        order = milestone
          ? milestone.order
          : 9999;
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          label,
          order,
          moves: [],
        });
      }

      groupMap.get(key).moves.push({
        move,
        originalIndex: index,
      });
    });

    return [...groupMap.values()]
      .map((group) => ({
        ...group,
        moves: group.moves
          .sort((left, right) => {
            const leftDate =
              parseCalendarDate(
                left.move?.startDate
              ) ||
              parseCalendarDate(
                left.move?.dueDate
              );

            const rightDate =
              parseCalendarDate(
                right.move?.startDate
              ) ||
              parseCalendarDate(
                right.move?.dueDate
              );

            if (leftDate && rightDate) {
              const dateDifference =
                calendarStamp(leftDate) -
                calendarStamp(rightDate);

              if (dateDifference !== 0) {
                return dateDifference;
              }
            } else if (leftDate) {
              return -1;
            } else if (rightDate) {
              return 1;
            }

            return getMoveTitle(
              left.move
            ).localeCompare(
              getMoveTitle(right.move)
            );
          })
          .map((entry) => entry.move),
      }))
      .sort(
        (left, right) =>
          left.order - right.order ||
          left.label.localeCompare(
            right.label
          )
      );
  }, [
    groupBy,
    localMoves,
    milestoneById,
  ]);

  const datedMoveCount = useMemo(
    () =>
      localMoves.filter(
        (move) =>
          parseCalendarDate(move?.startDate) ||
          parseCalendarDate(move?.dueDate)
      ).length,
    [localMoves]
  );

  const dueOnlyCount = useMemo(
    () =>
      localMoves.filter(
        (move) =>
          !parseCalendarDate(move?.startDate) &&
          parseCalendarDate(move?.dueDate)
      ).length,
    [localMoves]
  );

  const gridStep =
    zoomConfig.gridDays *
    zoomConfig.pixelsPerDay;

  const timelineGridStyle = {
    backgroundImage:
      "linear-gradient(to right, rgba(148,163,184,0.14) 1px, transparent 1px)",
    backgroundSize: `${gridStep}px 100%`,
  };

  const scrollToToday = useCallback(
    (behavior = "smooth") => {
      const scroller = scrollerRef.current;

      if (!scroller) return;

      const target =
        LABEL_WIDTH +
        todayLeft -
        scroller.clientWidth / 2;

      scroller.scrollTo({
        left: Math.max(0, target),
        behavior,
      });
    },
    [todayLeft]
  );

  useEffect(() => {
    const timeout = window.setTimeout(
      () => scrollToToday("auto"),
      40
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [scrollToToday, zoom]);

  const mergeMoveIntoLocalState =
    useCallback((previousMove, nextMove) => {
      const previousId =
        normalizeId(previousMove);

      const merged = {
        ...previousMove,
        ...(nextMove || {}),
      };

      setLocalMoves((currentMoves) => {
        let found = false;

        const updated = currentMoves.map(
          (move) => {
            if (
              normalizeId(move) !== previousId
            ) {
              return move;
            }

            found = true;
            return {
              ...move,
              ...merged,
            };
          }
        );

        return found
          ? updated
          : [...updated, merged];
      });

      return merged;
    }, []);

  const handleOpenMove = useCallback(
    async (move) => {
      setSelectedMove(move);

      const moveId = normalizeId(move);

      if (!moveId) return;

      setSelectedMoveLoading(true);

      try {
        const detail =
          await fetchTaskDetail(moveId);

        if (detail) {
          const merged =
            mergeMoveIntoLocalState(
              move,
              detail
            );

          setSelectedMove(merged);
        }
      } catch {
        // Keep the already-loaded Move as a safe fallback.
      } finally {
        setSelectedMoveLoading(false);
      }
    },
    [mergeMoveIntoLocalState]
  );

  const handleSaveMove = useCallback(
    async (move, updates) => {
      if (readOnly) return null;

      const moveId = normalizeId(move);

      if (!moveId) {
        throw new Error(
          "The selected Move is missing its ID."
        );
      }

      const saved = await updateTask(
        moveId,
        updates
      );

      const merged =
        mergeMoveIntoLocalState(
          move,
          saved
        );

      setSelectedMove(merged);

      return merged;
    },
    [
      mergeMoveIntoLocalState,
      readOnly,
    ]
  );

  const handleCompleteMove = useCallback(
    async (move) => {
      if (readOnly) return null;

      const moveId = normalizeId(move);

      if (!moveId) {
        throw new Error(
          "The selected Move is missing its ID."
        );
      }

      const completed =
        await completeTask(moveId);

      const merged =
        mergeMoveIntoLocalState(move, {
          ...(completed || {}),
          status:
            completed?.status || "done",
        });

      setSelectedMove(merged);

      return merged;
    },
    [
      mergeMoveIntoLocalState,
      readOnly,
    ]
  );

  // openshare-mobile-flightpath-v1
  // openshare-mobile-flightpath-v2-polish
  // Mobile defaults to a readable Timeline. The existing
  // full Gantt remains available on phones and unchanged
  // as the standard desktop planning canvas.
  const [mobileView, setMobileView] =
    useState("timeline");

  const getMobileFlightpathStatusMeta = (
    status
  ) => {
    const normalized = String(
      status || "backlog"
    )
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

    const statuses = {
      backlog: {
        label: "Backlog",
        dot: "bg-slate-400",
        pill:
          "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-300",
      },
      todo: {
        label: "To do",
        dot: "bg-slate-400",
        pill:
          "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-300",
      },
      inprogress: {
        label: "In progress",
        dot: "bg-cyan-500",
        pill:
          "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
      },
      ready: {
        label: "Ready",
        dot: "bg-violet-500",
        pill:
          "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
      },
      review: {
        label: "Review",
        dot: "bg-amber-500",
        pill:
          "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
      },
      done: {
        label: "Done",
        dot: "bg-emerald-500",
        pill:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      },
      completed: {
        label: "Done",
        dot: "bg-emerald-500",
        pill:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      },
    };

    return (
      statuses[normalized] || {
        label: status || "Backlog",
        dot: "bg-slate-400",
        pill:
          "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-300",
      }
    );
  };

  const renderGuides = () => (
    <FlightpathGuides
      activeMilestonePoint={
        activeMilestonePoint
      }
      todayLeft={todayLeft}
      timelineWidth={timelineWidth}
    />
  );

  return (
    <>
      <div
        data-project-id={projectId || ""}
        className="mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-6 sm:py-6 lg:px-10"
      >
        <section className="overflow-hidden rounded-[28px] border border-violet-200/80 sm:rounded-[32px] bg-white/88 shadow-[0_30px_90px_rgba(76,29,149,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-[#08111f]/90">
          <div className="border-b border-slate-200/80 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-6 py-6 dark:border-white/10 dark:from-violet-500/10 dark:via-[#08111f] dark:to-cyan-500/10 lg:px-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-violet-700 dark:border-violet-400/20 dark:bg-white/5 dark:text-violet-300">
                    <Route className="h-3.5 w-3.5" />
                    <span className="md:hidden">
                      {mobileView === "timeline"
                        ? "Timeline planning"
                        : "Gantt planning"}
                    </span>
                    <span className="hidden md:inline">
                      Gantt-style planning
                    </span>
                  </span>

                  {readOnly ? (
                    <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                      View only
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  Flightpath
                </h2>

                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600 dark:text-zinc-400">
                  <span className="md:hidden">
                    See Moves across time toward milestones.
                  </span>
                  <span className="hidden md:inline">
                    See how Moves travel across time toward
                    milestones and the project&apos;s finish line.
                  </span>
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
                <div className="grid grid-cols-2 rounded-2xl border border-violet-200 bg-white/85 p-1 shadow-sm dark:border-violet-400/20 dark:bg-white/5 md:hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setMobileView("timeline")
                    }
                    className={`rounded-xl px-4 py-2.5 text-xs font-black transition ${
                      mobileView === "timeline"
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                        : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    Timeline
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMobileView("gantt")
                    }
                    className={`rounded-xl px-4 py-2.5 text-xs font-black transition ${
                      mobileView === "gantt"
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                        : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    Gantt
                  </button>
                </div>

                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <Layers3 className="h-4 w-4 text-violet-500" />

                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Group
                  </span>

                  <select
                    value={groupBy}
                    onChange={(event) =>
                      setGroupBy(
                        event.target.value
                      )
                    }
                    className="bg-transparent text-sm font-black text-slate-800 outline-none dark:text-white"
                  >
                    <option value="milestone">
                      Milestone
                    </option>
                    <option value="status">
                      Status
                    </option>
                  </select>
                </label>

                <div className={`${mobileView === "gantt" ? "inline-flex" : "hidden"} rounded-2xl border border-slate-200 bg-white/85 p-1 shadow-sm dark:border-white/10 dark:bg-white/5 md:inline-flex`}>
                  {Object.entries(
                    ZOOM_LEVELS
                  ).map(([value, config]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setZoom(value)
                      }
                      className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                        zoom === value
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    scrollToToday("smooth")
                  }
                  className={`${mobileView === "gantt" ? "inline-flex" : "hidden"} items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-xs font-black text-cyan-800 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200 md:inline-flex`}
                >
                  <Crosshair className="h-4 w-4" />
                  Today
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-2 py-3 text-center sm:px-4 sm:text-left dark:border-white/10 dark:bg-white/5">
                <p className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400 sm:text-[10px] sm:tracking-[0.2em]">
                  <span className="sm:hidden">
                    Moves
                  </span>
                  <span className="hidden sm:inline">
                    Dated Moves
                  </span>
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                  {datedMoveCount}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-2 py-3 text-center sm:px-4 sm:text-left dark:border-white/10 dark:bg-white/5">
                <p className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400 sm:text-[10px] sm:tracking-[0.2em]">
                  <span className="sm:hidden">
                    Due
                  </span>
                  <span className="hidden sm:inline">
                    Due-only markers
                  </span>
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                  {dueOnlyCount}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-2 py-3 text-center sm:px-4 sm:text-left dark:border-white/10 dark:bg-white/5">
                <p className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400 sm:text-[10px] sm:tracking-[0.2em]">
                  <span className="sm:hidden">
                    Milestones
                  </span>
                  <span className="hidden sm:inline">
                    Dated milestones
                  </span>
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                  {milestonePoints.length}
                </p>
              </div>
            </div>
          </div>

            {localMoves.length > 0 &&
            mobileView === "timeline" ? (
              <div className="bg-gradient-to-b from-white via-violet-50/35 to-cyan-50/30 px-4 py-5 dark:from-[#08111f] dark:via-violet-500/[0.035] dark:to-cyan-500/[0.025] md:hidden">
                <div className="flex items-end justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-white/10">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
                      Timeline range
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                      {formatShortDate(
                        timelineRange.start
                      )}{" "}
                      –{" "}
                      {formatShortDate(
                        timelineRange.end
                      )}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-[10px] font-black text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                    {localMoves.length} Moves
                  </span>
                </div>

                <div className="mt-5 space-y-6">
                  {groups.map((group) => (
                    <section
                      key={group.key}
                      className="min-w-0"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-slate-700 dark:text-zinc-200">
                            {group.label}
                          </p>

                          <p className="mt-0.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                            {groupBy === "milestone"
                              ? String(
                                  group.label || ""
                                ).trim().toLowerCase() ===
                                "no milestone"
                                ? "Unassigned Moves"
                                : "Milestone path"
                              : "Status group"}
                          </p>
                        </div>

                        <span className="grid h-7 min-w-7 place-items-center rounded-full bg-white px-2 text-[10px] font-black text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10">
                          {group.moves.length}
                        </span>
                      </div>

                      <div className="relative mt-3 space-y-2 pl-5">
                        <span
                          aria-hidden="true"
                          className="absolute bottom-3 left-[5px] top-3 w-px bg-gradient-to-b from-violet-300 via-cyan-300 to-slate-200 dark:from-violet-500/40 dark:via-cyan-500/30 dark:to-white/10"
                        />

                        {group.moves.map((move) => {
                          const title =
                            getMoveTitle(move);

                          const start =
                            parseCalendarDate(
                              move?.startDate
                            );

                          const due =
                            parseCalendarDate(
                              move?.dueDate
                            );

                          const meta =
                            getMobileFlightpathStatusMeta(
                              move?.status
                            );

                          const dateLabel =
                            start && due
                              ? `${formatShortDate(
                                  start
                                )} → ${formatShortDate(
                                  due
                                )}`
                              : due
                                ? `Due ${formatShortDate(
                                    due
                                  )}`
                                : start
                                  ? `Starts ${formatShortDate(
                                      start
                                    )}`
                                  : "Unscheduled";

                          return (
                            <button
                              key={
                                normalizeId(move) ||
                                `${group.key}-${title}`
                              }
                              type="button"
                              onClick={() =>
                                handleOpenMove(move)
                              }
                              className="relative w-full rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 text-left shadow-sm transition active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.045]"
                            >
                              <span
                                aria-hidden="true"
                                className={`absolute -left-5 top-[22px] h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-[#0b1320] ${meta.dot}`}
                              />

                              <div className="flex items-start justify-between gap-3">
                                <span className="min-w-0 flex-1 text-sm font-black leading-5 text-slate-900 dark:text-white">
                                  {title}
                                </span>

                                <span
                                  aria-hidden="true"
                                  className="shrink-0 text-xl leading-5 text-slate-300 dark:text-zinc-600"
                                >
                                  ›
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.10em] ${meta.pill}`}
                                >
                                  {meta.label}
                                </span>

                                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                                  {dateLabel}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            ) : null}

          {localMoves.length === 0 ? (
            <div className="px-6 py-20 text-center lg:px-8">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                <Route className="h-8 w-8" />
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-white">
                No Moves to chart yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
                Add Moves and assign Start or
                Due dates to begin drawing this
                project&apos;s Flightpath.
              </p>
            </div>
          ) : (
            <div
              ref={scrollerRef}
              className={`${mobileView === "gantt" ? "block" : "hidden"} overflow-x-auto overscroll-x-contain bg-white dark:bg-[#08111f] md:block`}
            >
              <div
                style={{
                  minWidth:
                    LABEL_WIDTH +
                    timelineWidth,
                }}
              >
                <div
                  className="grid border-b border-slate-200/80 dark:border-white/10"
                  style={{
                    gridTemplateColumns: `${LABEL_WIDTH}px ${timelineWidth}px`,
                  }}
                >
                  <div className="sticky left-0 z-30 flex h-20 items-center border-r border-slate-300 bg-white shadow-[8px_0_18px_rgba(15,23,42,0.06)] px-5 backdrop-blur-xl dark:border-white/10 dark:bg-[#08111f]/95">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Timeline range
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-800 dark:text-white">
                        {formatShortDate(
                          timelineRange.start
                        )}{" "}
                        –{" "}
                        {formatShortDate(
                          timelineRange.end
                        )}
                      </p>
                    </div>
                  </div>

                  <div
                    className="relative h-20 overflow-hidden bg-white dark:bg-white/[0.035]"
                    style={{
                      width: timelineWidth,
                    }}
                  >
                    <div className="absolute inset-0 flex">
                      {headerSegments.map(
                        (segment) => (
                          <div
                            key={segment.key}
                            className="shrink-0 border-r border-slate-200/80 px-2 py-3 dark:border-white/[0.07]"
                            style={{
                              width:
                                segment.width,
                            }}
                          >
                            <p className="whitespace-nowrap text-center text-[10px] font-black uppercase tracking-[0.10em] text-slate-600 dark:text-zinc-300">
                              {segment.label}
                            </p>

                            {segment.sublabel ? (
                              <p className="mt-1 whitespace-nowrap text-center text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-zinc-500">
                                {
                                  segment.sublabel
                                }
                              </p>
                            ) : null}
                          </div>
                        )
                      )}
                    </div>

                    {renderGuides()}
                  </div>
                </div>

                <div
                  className="grid border-b border-fuchsia-200/70 bg-fuchsia-50/80 dark:border-fuchsia-400/10 dark:bg-fuchsia-500/[0.035]"
                  style={{
                    gridTemplateColumns: `${LABEL_WIDTH}px ${timelineWidth}px`,
                  }}
                >
                  <div className="sticky left-0 z-30 flex h-24 items-center gap-3 border-r border-fuchsia-200 bg-fuchsia-50 shadow-[8px_0_18px_rgba(15,23,42,0.06)] px-5 backdrop-blur-xl dark:border-fuchsia-400/10 dark:bg-[#120c20]/95">
                    <Flag className="h-4 w-4 text-fuchsia-500" />

                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        Milestones
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        Project finish markers
                      </p>
                    </div>
                  </div>

                  <div
                    className="relative h-24 bg-fuchsia-50/60 dark:bg-fuchsia-500/[0.025]"
                    style={{
                      width: timelineWidth,
                      ...timelineGridStyle,
                    }}
                  >
                    {renderGuides()}

                    {milestoneDisplayItems.map(
                      (item) => {
                        const isActive =
                          activeMilestoneKey ===
                          item.key;

                        const showLabel =
                          zoom === "day" ||
                          isActive;

                        const top =
                          zoom === "day"
                            ? item.lane === 0
                              ? 6
                              : item.lane === 1
                                ? 34
                                : 62
                            : 34;

                        const labelOnLeft =
                          item.left >
                          timelineWidth - 210;

                        const tooltip =
                          getMilestoneDisplayTooltip(
                            item
                          );

                        return (
                          <button
                            key={item.key}
                            type="button"
                            className="group absolute z-20 h-7 w-7 -translate-x-1/2 appearance-none rounded-full border-0 bg-transparent p-0 shadow-none outline-none hover:bg-transparent focus:bg-transparent"
                            style={{
                              left: clamp(
                                item.left,
                                14,
                                Math.max(
                                  14,
                                  timelineWidth - 14
                                )
                              ),
                              top,
                              background:
                                "transparent",
                              border: 0,
                              padding: 0,
                              boxShadow: "none",
                            }}
                            title={tooltip}
                            aria-label={tooltip}
                            onMouseEnter={() =>
                              setHoveredMilestoneKey(
                                item.key
                              )
                            }
                            onMouseLeave={() =>
                              setHoveredMilestoneKey(
                                null
                              )
                            }
                            onFocus={() =>
                              setHoveredMilestoneKey(
                                item.key
                              )
                            }
                            onBlur={() =>
                              setHoveredMilestoneKey(
                                null
                              )
                            }
                            onClick={() =>
                              setSelectedMilestoneKey(
                                (current) =>
                                  current === item.key
                                    ? null
                                    : item.key
                              )
                            }
                          >
                            {item.count > 1 ? (
                              <span
                                className={`grid h-7 min-w-7 place-items-center rounded-full border-2 px-1 text-[9px] font-black shadow-lg transition ${
                                  isActive
                                    ? "border-fuchsia-700 bg-fuchsia-600 text-white ring-4 ring-fuchsia-400/20"
                                    : "border-white bg-fuchsia-500 text-white dark:border-[#08111f]"
                                }`}
                              >
                                +{item.count}
                              </span>
                            ) : (
                              <span
                                className={`mx-auto mt-2 block h-3 w-3 rotate-45 rounded-[3px] border-2 shadow-sm transition ${
                                  isActive
                                    ? "border-fuchsia-800 bg-fuchsia-600 ring-4 ring-fuchsia-400/20"
                                    : "border-white bg-fuchsia-500 ring-1 ring-fuchsia-500/20 dark:border-[#08111f]"
                                }`}
                              />
                            )}

                            {showLabel ? (
                              <span
                                className={`pointer-events-none absolute top-1/2 z-30 max-w-[190px] -translate-y-1/2 truncate rounded-lg border border-fuchsia-100 bg-white px-2.5 py-1.5 text-left text-[9px] font-black text-fuchsia-700 shadow-lg dark:border-fuchsia-400/10 dark:bg-[#17111f] dark:text-fuchsia-300 ${
                                  labelOnLeft
                                    ? "right-full mr-2"
                                    : "left-full ml-2"
                                }`}
                              >
                                {item.count > 1
                                  ? `${item.count} milestones`
                                  : item.title}
                              </span>
                            ) : null}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {groups.map((group) => (
                  <div key={group.key}>
                    <div
                      className="grid border-b border-slate-200/80 bg-slate-50 dark:border-white/[0.07] dark:bg-white/[0.035]"
                      style={{
                        gridTemplateColumns: `${LABEL_WIDTH}px ${timelineWidth}px`,
                      }}
                    >
                      <div className="sticky left-0 z-30 flex h-11 items-center gap-2 border-r border-slate-300 bg-slate-100 shadow-[8px_0_18px_rgba(15,23,42,0.06)] px-5 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#111925]/95">
                        <Layers3 className="h-3.5 w-3.5 text-violet-500" />

                        <span className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 dark:text-zinc-300">
                          {group.label}
                        </span>

                        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-500 shadow-sm dark:bg-white/10 dark:text-zinc-400">
                          {group.moves.length}
                        </span>
                      </div>

                      <div
                        className="relative h-11 bg-slate-50/70 dark:bg-white/[0.025]"
                        style={{
                          width:
                            timelineWidth,
                          ...timelineGridStyle,
                        }}
                      >
                        {renderGuides()}
                      </div>
                    </div>

                    {group.moves.map((move) => {
                      const moveId =
                        normalizeId(move);

                      const title =
                        getMoveTitle(move);

                      const statusMeta =
                        getStatusMeta(
                          move?.status
                        );

                      const start =
                        parseCalendarDate(
                          move?.startDate
                        );

                      const due =
                        parseCalendarDate(
                          move?.dueDate
                        );

                      const rangeStart =
                        start && due
                          ? earlierDate(
                              start,
                              due
                            )
                          : start;

                      const rangeEnd =
                        start && due
                          ? laterDate(
                              start,
                              due
                            )
                          : start;

                      const barLeft =
                        rangeStart
                          ? positionForDate(
                              rangeStart
                            )
                          : 0;

                      const durationDays =
                        rangeStart &&
                        rangeEnd
                          ? Math.max(
                              1,
                              differenceInCalendarDays(
                                rangeStart,
                                rangeEnd
                              ) + 1
                            )
                          : 0;

                      const barWidth =
                        durationDays *
                        zoomConfig.pixelsPerDay;

                      const displayBarLeft =
                        rangeStart
                          ? clamp(
                              barLeft,
                              0,
                              Math.max(
                                0,
                                timelineWidth - 2
                              )
                            )
                          : 0;

                      const displayBarWidth =
                        rangeStart
                          ? Math.max(
                              2,
                              Math.min(
                                barWidth,
                                timelineWidth -
                                  displayBarLeft
                              )
                            )
                          : 0;

                      const clickTargetLeft =
                        rangeStart
                          ? Math.max(
                              0,
                              displayBarLeft - 8
                            )
                          : 0;

                      const clickTargetWidth =
                        rangeStart
                          ? Math.min(
                              timelineWidth -
                                clickTargetLeft,
                              Math.max(
                                44,
                                displayBarWidth + 16
                              )
                            )
                          : 0;

                      const rightLabelSpace =
                        timelineWidth -
                        (
                          displayBarLeft +
                          displayBarWidth +
                          MOVE_LABEL_GAP
                        );

                      const placeLabelOnLeft =
                        rangeStart &&
                        rightLabelSpace <
                          MOVE_LABEL_WIDTH &&
                        displayBarLeft >=
                          MOVE_LABEL_WIDTH +
                            MOVE_LABEL_GAP;

                      const rawMoveLabelLeft =
                        placeLabelOnLeft
                          ? displayBarLeft -
                            MOVE_LABEL_GAP -
                            MOVE_LABEL_WIDTH
                          : displayBarLeft +
                            displayBarWidth +
                            MOVE_LABEL_GAP;

                      const moveLabelLeft =
                        rangeStart
                          ? clamp(
                              rawMoveLabelLeft,
                              0,
                              Math.max(
                                0,
                                timelineWidth -
                                  MOVE_LABEL_WIDTH
                              )
                            )
                          : 0;

                      const dueOnly =
                        !start && Boolean(due);

                      const dueOnlyLeft = due
                        ? positionForDate(
                            due
                          ) +
                          zoomConfig.pixelsPerDay /
                            2
                        : 0;

                      return (
                        <div
                          key={
                            moveId ||
                            `${group.key}-${title}`
                          }
                          className="grid border-b border-slate-200/70 last:border-b-0 dark:border-white/[0.06]"
                          style={{
                            gridTemplateColumns: `${LABEL_WIDTH}px ${timelineWidth}px`,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenMove(
                                move
                              )
                            }
                            className="sticky left-0 z-20 flex h-16 min-w-0 items-center gap-3 border-r border-slate-300 bg-white shadow-[8px_0_18px_rgba(15,23,42,0.06)] px-5 text-left transition hover:bg-violet-50 dark:border-white/[0.07] dark:bg-[#08111f]/96 dark:hover:bg-violet-500/[0.08]"
                          >
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusMeta.dot}`}
                            />

                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-slate-900 dark:text-white">
                                {title}
                              </span>

                              <span className="mt-1 flex min-w-0 items-center gap-2">
                                <span className="truncate text-[10px] font-black uppercase tracking-[0.13em] text-slate-400 dark:text-zinc-500">
                                  {
                                    statusMeta.label
                                  }
                                </span>

                                {!start &&
                                !due ? (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-500 dark:bg-white/10 dark:text-zinc-400">
                                    Unscheduled
                                  </span>
                                ) : null}
                              </span>
                            </span>
                          </button>

                          <div
                            className="relative h-16 bg-white dark:bg-[#08111f]"
                            style={{
                              width:
                                timelineWidth,
                              ...timelineGridStyle,
                            }}
                          >
                            {renderGuides()}

                            {rangeStart ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenMove(
                                      move
                                    )
                                  }
                                  className="absolute top-1/2 z-30 h-11 -translate-y-1/2 rounded-xl bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70"
                                  style={{
                                    left:
                                      clickTargetLeft,
                                    width:
                                      clickTargetWidth,
                                  }}
                                  aria-label={`Open ${title}`}
                                  title={`${title} · ${formatFullDate(
                                    rangeStart
                                  )}${
                                    due
                                      ? ` to ${formatFullDate(
                                          due
                                        )}`
                                      : ""
                                  }`}
                                >
                                  <span className="sr-only">
                                    Open {title}
                                  </span>
                                </button>

                                <div
                                  aria-hidden="true"
                                  className={`pointer-events-none absolute top-1/2 z-20 h-5 -translate-y-1/2 rounded-full border shadow-sm ${statusMeta.bar}`}
                                  style={{
                                    left:
                                      displayBarLeft,
                                    width:
                                      displayBarWidth,
                                  }}
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenMove(
                                      move
                                    )
                                  }
                                  className="absolute top-1/2 z-40 flex h-8 -translate-y-1/2 items-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white px-3 text-left text-[10px] font-black text-slate-800 shadow-md transition hover:-translate-y-[55%] hover:border-violet-300 hover:shadow-lg dark:border-white/10 dark:bg-[#151c28] dark:text-white"
                                  style={{
                                    left:
                                      moveLabelLeft,
                                    width:
                                      MOVE_LABEL_WIDTH,
                                  }}
                                  title={`${title} · ${formatFullDate(
                                    rangeStart
                                  )}${
                                    due
                                      ? ` to ${formatFullDate(
                                          due
                                        )}`
                                      : ""
                                  }`}
                                >
                                  <span
                                    className={`h-2 w-2 shrink-0 rounded-full ${statusMeta.dot}`}
                                  />

                                  <span className="min-w-0 flex-1 truncate">
                                    {title}
                                  </span>

                                  {due ? (
                                    <span className="shrink-0 text-[9px] text-slate-400 dark:text-zinc-500">
                                      {formatShortDate(
                                        due
                                      )}
                                    </span>
                                  ) : null}
                                </button>
                              </>
                            ) : null}

                            {dueOnly ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenMove(
                                    move
                                  )
                                }
                                className="absolute top-1/2 z-30 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[4px] border-2 border-white bg-amber-500 shadow-lg shadow-amber-500/30 transition hover:scale-125 dark:border-[#08111f]"
                                style={{
                                  left: clamp(
                                    dueOnlyLeft,
                                    0,
                                    timelineWidth
                                  ),
                                }}
                                title={`${title} is due ${formatFullDate(
                                  due
                                )}`}
                              />
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`${mobileView === "gantt" ? "flex" : "hidden"} flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200/80 bg-slate-50/80 px-6 py-4 text-[10px] font-bold text-slate-500 dark:border-white/10 dark:bg-white/[0.025] dark:text-zinc-400 md:flex lg:px-8`}>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-8 rounded-full bg-violet-300 dark:bg-violet-500/40" />
              Move duration
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rotate-45 rounded-[3px] bg-amber-500" />
              Due-only Move
            </span>

            <span className="inline-flex items-center gap-2">
              <Flag className="h-3.5 w-3.5 text-fuchsia-500" />
              Milestone
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="h-4 border-l-2 border-cyan-500" />
              Today
            </span>

            <span className="ml-auto inline-flex items-center gap-2">
              {readOnly ? (
                <Clock3 className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              )}

              {readOnly
                ? "Open Moves to inspect details"
                : "Click any Move to edit it"}
            </span>
          </div>
        </section>
      </div>

      <MoveTaskDetailDrawer
        open={Boolean(selectedMove)}
        task={selectedMove}
        members={safeMembers}
        projectTasks={localMoves}
        dependenciesLoading={
          selectedMoveLoading
        }
        disabled={readOnly}
        onClose={() =>
          setSelectedMove(null)
        }
        onSave={handleSaveMove}
        onComplete={handleCompleteMove}
      />
    </>
  );
}
