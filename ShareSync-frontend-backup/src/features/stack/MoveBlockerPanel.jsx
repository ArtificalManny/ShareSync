import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";

function normalizeId(value) {
  if (!value) return "";

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return normalizeId(
    value?.userId ||
      value?.user ||
      value?.memberId ||
      value?.member ||
      value?._id ||
      value?.id
  );
}

function memberLabel(member) {
  const nested =
    member?.user ||
    member?.member ||
    member?.profile ||
    {};

  const firstName =
    member?.firstName ||
    nested?.firstName ||
    "";

  const lastName =
    member?.lastName ||
    nested?.lastName ||
    "";

  const fullName =
    `${firstName} ${lastName}`.trim();

  return (
    member?.name ||
    member?.displayName ||
    member?.fullName ||
    nested?.name ||
    nested?.displayName ||
    nested?.fullName ||
    fullName ||
    member?.username ||
    nested?.username ||
    member?.email ||
    nested?.email ||
    "Project member"
  );
}

function toDateInputValue(value) {
  if (!value) return "";

  const raw = String(value);
  const direct = raw.match(
    /^(\d{4}-\d{2}-\d{2})/
  );

  if (direct) return direct[1];

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(date);
}

function blockerAge(value) {
  if (!value) return "";

  const started = new Date(value);

  if (Number.isNaN(started.getTime())) {
    return "";
  }

  const elapsed =
    Date.now() - started.getTime();

  const days = Math.max(
    0,
    Math.floor(
      elapsed / (24 * 60 * 60 * 1000)
    )
  );

  if (days === 0) return "Blocked today";
  if (days === 1) return "Blocked for 1 day";

  return `Blocked for ${days} days`;
}

function errorMessage(error) {
  const raw =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "The blocker could not be updated.";

  if (Array.isArray(raw)) {
    return raw.join(" ");
  }

  return String(raw);
}

export default function MoveBlockerPanel({
  task,
  members = [],
  disabled = false,
  onUpdate,
} = {}) {
  const [currentTask, setCurrentTask] =
    useState(task);

  const [mode, setMode] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [resolverId, setResolverId] =
    useState("");

  const [
    expectedUnblockDate,
    setExpectedUnblockDate,
  ] = useState("");

  const [
    escalationRecipientId,
    setEscalationRecipientId,
  ] = useState("");

  const [
    escalationNote,
    setEscalationNote,
  ] = useState("");

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setCurrentTask(task);

    setReason(
      String(
        task?.blockerReason || ""
      )
    );

    setResolverId(
      normalizeId(
        task?.blockerOwnerId
      )
    );

    setExpectedUnblockDate(
      toDateInputValue(
        task?.expectedUnblockDate
      )
    );

    setEscalationRecipientId(
      normalizeId(
        task?.escalatedToId ||
          task?.blockerOwnerId
      )
    );

    setEscalationNote(
      String(
        task?.escalationNote || ""
      )
    );

    setMode("");
    setError("");
  }, [task]);

  const memberOptions = useMemo(() => {
    const seen = new Set();

    return (
      Array.isArray(members)
        ? members
        : []
    )
      .map((member) => ({
        id: normalizeId(member),
        label: memberLabel(member),
      }))
      .filter((member) => {
        if (
          !member.id ||
          seen.has(member.id)
        ) {
          return false;
        }

        seen.add(member.id);
        return true;
      });
  }, [members]);

  const memberNameById = useMemo(
    () =>
      new Map(
        memberOptions.map(
          (member) => [
            member.id,
            member.label,
          ]
        )
      ),
    [memberOptions]
  );

  const isBlocked =
    currentTask?.isBlocked === true;

  const escalationLevel =
    Number(
      currentTask?.escalationLevel ||
        0
    );

  const isEscalated =
    escalationLevel === 1;

  const blockerOwnerId =
    normalizeId(
      currentTask?.blockerOwnerId
    );

  const escalatedToId =
    normalizeId(
      currentTask?.escalatedToId
    );

  const canMutate =
    !disabled &&
    typeof onUpdate === "function";

  const applyUpdate = async (
    patch
  ) => {
    if (!canMutate || busy) {
      return null;
    }

    setBusy(true);
    setError("");

    try {
      const saved =
        await onUpdate(patch);

      if (saved) {
        setCurrentTask(saved);
      } else {
        setCurrentTask(
          (previous) => ({
            ...(previous || {}),
            ...patch,
          })
        );
      }

      return saved || patch;
    } catch (updateError) {
      setError(
        errorMessage(updateError)
      );

      return null;
    } finally {
      setBusy(false);
    }
  };

  const openMarkBlocked = () => {
    setReason(
      String(
        currentTask?.blockerReason ||
          ""
      )
    );

    setResolverId(
      normalizeId(
        currentTask?.blockerOwnerId
      )
    );

    setExpectedUnblockDate(
      toDateInputValue(
        currentTask
          ?.expectedUnblockDate
      )
    );

    setError("");
    setMode("mark");
  };

  const openEscalation = () => {
    setEscalationRecipientId(
      normalizeId(
        currentTask?.escalatedToId ||
          currentTask
            ?.blockerOwnerId
      )
    );

    setEscalationNote(
      String(
        currentTask
          ?.escalationNote || ""
      )
    );

    setError("");
    setMode("escalate");
  };

  const handleMarkBlocked =
    async () => {
      const trimmedReason =
        reason.trim();

      if (!trimmedReason) {
        setError(
          "Explain what is stopping this Move."
        );
        return;
      }

      const result =
        await applyUpdate({
          isBlocked: true,
          blockerReason:
            trimmedReason,
          blockerOwnerId:
            resolverId || null,
          expectedUnblockDate:
            expectedUnblockDate
              ? `${expectedUnblockDate}T12:00:00.000Z`
              : null,
        });

      if (result) {
        setMode("");
      }
    };

  const handleResolve =
    async () => {
      const result =
        await applyUpdate({
          isBlocked: false,

          // These are current-blocker fields.
          // Clear them so older UI heuristics
          // do not continue treating the
          // resolved Move as blocked.
          blockerReason: "",
          blockerOwnerId: null,
          expectedUnblockDate: null,
        });

      if (result) {
        setReason("");
        setResolverId("");
        setExpectedUnblockDate("");
        setEscalationRecipientId("");
        setEscalationNote("");
        setMode("");
      }
    };

  const handleEscalate =
    async () => {
      if (
        !escalationRecipientId
      ) {
        setError(
          "Choose who needs to receive this escalation."
        );
        return;
      }

      const result =
        await applyUpdate({
          escalationLevel: 1,
          escalatedToId:
            escalationRecipientId,
          escalationNote:
            escalationNote.trim(),
        });

      if (result) {
        setMode("");
      }
    };

  const cancelMode = () => {
    setMode("");
    setError("");
  };

  return (
    <section
      data-move-blocker-panel="true"
      className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.035] sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
            <ShieldAlert
              className={
                isBlocked
                  ? "h-4 w-4 text-amber-500"
                  : "h-4 w-4 text-emerald-500"
              }
            />

            Blocker
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-400">
            {isBlocked
              ? "Capture what is stopping this Move and who can help unblock it."
              : "This state is separate from the Move's workflow stage."}
          </p>
        </div>

        {isBlocked ? (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              Blocked
            </span>

            {isEscalated ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Escalated
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {mode === "mark" ? (
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
              What's stopping this Move?
            </span>

            <textarea
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
              maxLength={2000}
              rows={3}
              disabled={busy}
              autoFocus
              placeholder="Waiting for approval, credentials, a decision, another team…"
              className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                <UserRound className="h-3.5 w-3.5" />
                Who can help?
              </span>

              <select
                value={resolverId}
                onChange={(event) =>
                  setResolverId(
                    event.target.value
                  )
                }
                disabled={
                  busy ||
                  !memberOptions.length
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-white"
              >
                <option value="">
                  Unassigned
                </option>

                {memberOptions.map(
                  (member) => (
                    <option
                      key={member.id}
                      value={member.id}
                    >
                      {member.label}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
                <CalendarDays className="h-3.5 w-3.5" />
                Expected unblock
              </span>

              <input
                type="date"
                value={
                  expectedUnblockDate
                }
                onChange={(event) =>
                  setExpectedUnblockDate(
                    event.target.value
                  )
                }
                disabled={busy}
                className="block min-w-0 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-white"
              />
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={cancelMode}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>

            <button
              type="button"
              onClick={
                handleMarkBlocked
              }
              disabled={
                busy ||
                !reason.trim()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldAlert className="h-4 w-4" />
              )}

              {busy
                ? "Saving…"
                : "Mark blocked"}
            </button>
          </div>
        </div>
      ) : mode === "escalate" ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
            Escalation sends an urgent
            attention request to a project
            member. It does not change this
            Move's workflow stage.
          </div>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
              <UserRound className="h-3.5 w-3.5" />
              Escalate to
            </span>

            <select
              value={
                escalationRecipientId
              }
              onChange={(event) =>
                setEscalationRecipientId(
                  event.target.value
                )
              }
              disabled={
                busy ||
                !memberOptions.length
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-white"
            >
              <option value="">
                Select project member
              </option>

              {memberOptions.map(
                (member) => (
                  <option
                    key={member.id}
                    value={member.id}
                  >
                    {member.label}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
              Why does this need attention?
            </span>

            <textarea
              value={escalationNote}
              onChange={(event) =>
                setEscalationNote(
                  event.target.value
                )
              }
              maxLength={2000}
              rows={3}
              disabled={busy}
              placeholder="Explain the impact or decision that is now at risk…"
              className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#19191f] dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </label>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={cancelMode}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>

            <button
              type="button"
              onClick={
                handleEscalate
              }
              disabled={
                busy ||
                !escalationRecipientId
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}

              {busy
                ? "Escalating…"
                : "Escalate blocker"}
            </button>
          </div>
        </div>
      ) : isBlocked ? (
        <div className="mt-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/25 dark:bg-amber-500/[0.08]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  {currentTask
                    ?.blockerReason ||
                    "This Move is blocked."}
                </div>

                {currentTask
                  ?.blockedSince ? (
                  <div className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {blockerAge(
                      currentTask
                        .blockedSince
                    )}
                    {" · "}
                    since{" "}
                    {formatDate(
                      currentTask
                        .blockedSince
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-zinc-500">
                  Resolver
                </div>

                <div className="mt-1 text-sm font-bold text-slate-800 dark:text-zinc-100">
                  {blockerOwnerId
                    ? memberNameById.get(
                        blockerOwnerId
                      ) ||
                      "Project member"
                    : "Unassigned"}
                </div>
              </div>

              <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-zinc-500">
                  Expected unblock
                </div>

                <div className="mt-1 text-sm font-bold text-slate-800 dark:text-zinc-100">
                  {currentTask
                    ?.expectedUnblockDate
                    ? formatDate(
                        currentTask
                          .expectedUnblockDate
                      )
                    : "No date set"}
                </div>
              </div>
            </div>

            {isEscalated ? (
              <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/80 px-3 py-3 dark:border-violet-500/25 dark:bg-violet-500/[0.08]">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.13em] text-violet-700 dark:text-violet-300">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Escalated
                </div>

                <div className="mt-1 text-sm font-bold text-slate-800 dark:text-zinc-100">
                  {escalatedToId
                    ? memberNameById.get(
                        escalatedToId
                      ) ||
                      "Project member"
                    : "Project member"}
                </div>

                {currentTask
                  ?.escalationNote ? (
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-zinc-300">
                    {
                      currentTask
                        .escalationNote
                    }
                  </p>
                ) : null}

                {currentTask
                  ?.escalatedAt ? (
                  <div className="mt-1 text-[11px] font-semibold text-violet-600 dark:text-violet-300">
                    {formatDate(
                      currentTask
                        .escalatedAt
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {canMutate ? (
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleResolve}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}

                Resolve blocker
              </button>

              <button
                type="button"
                onClick={
                  openEscalation
                }
                disabled={
                  busy ||
                  !memberOptions.length
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400"
              >
                <ArrowUpRight className="h-4 w-4" />

                {isEscalated
                  ? "Update escalation"
                  : "Escalate"}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-4 dark:border-white/10 dark:bg-[#19191f] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-zinc-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              This Move is clear
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-400">
              No operational blocker is
              preventing progress.
            </p>
          </div>

          {canMutate ? (
            <button
              type="button"
              onClick={
                openMarkBlocked
              }
              disabled={busy}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300"
            >
              <ShieldAlert className="h-4 w-4" />
              Mark blocked
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
