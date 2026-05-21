// src/features/stack/useStackTasks.js
// Project-wide task source for ProjectHome > Tasks
// - Fetches all tasks visible to the project from GET /projects/:projectId/tasks
// - Filters locally to the active stack: todo + in_progress
// - Keeps the existing StackPanel API intact
// - Supports socket refresh + polling fallback so other browsers/users stay updated

import { useCallback, useEffect, useRef, useState } from "react";
import { listTasks } from "../../api/tasks";

function normalizeId(value) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value?._id) return String(value._id).trim();
  if (value?.id) return String(value.id).trim();
  return value?.toString?.()?.trim?.() || "";
}

function unwrapTasks(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.tasks)) return payload.tasks;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.tasks)) return payload.data.tasks;
  return [];
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function isStackTask(task) {
  const status = normalizeStatus(task?.status);

  return (
    status === "todo" ||
    status === "to_do" ||
    status === "open" ||
    status === "in_progress" ||
    status === "in-progress"
  );
}

function getTaskProjectId(task) {
  return normalizeId(
    task?.projectId ||
      task?.project ||
      task?.project?._id ||
      task?.project?.id
  );
}

function getTaskAssigneeId(task) {
  return normalizeId(
    task?.assigneeId ||
      task?.assignee ||
      task?.assignedTo ||
      task?.assignedToId ||
      task?.ownerId ||
      task?.owner
  );
}

function sortStackTasks(list) {
  const priorityRank = (priority) => {
    const value = String(priority || "").toLowerCase();
    if (value === "critical") return 4;
    if (value === "high") return 3;
    if (value === "medium") return 2;
    if (value === "low") return 1;
    return 0;
  };

  return [...list].sort((a, b) => {
    const blockingA = a?.isBlocking ? 1 : 0;
    const blockingB = b?.isBlocking ? 1 : 0;
    if (blockingB !== blockingA) return blockingB - blockingA;

    const priorityA = priorityRank(a?.priority);
    const priorityB = priorityRank(b?.priority);
    if (priorityB !== priorityA) return priorityB - priorityA;

    const orderA = Number.isFinite(Number(a?.stackOrder))
      ? Number(a.stackOrder)
      : 999999;
    const orderB = Number.isFinite(Number(b?.stackOrder))
      ? Number(b.stackOrder)
      : 999999;
    if (orderA !== orderB) return orderA - orderB;

    const dueA = a?.dueDate ? new Date(a.dueDate).getTime() : 9999999999999;
    const dueB = b?.dueDate ? new Date(b.dueDate).getTime() : 9999999999999;
    if (dueA !== dueB) return dueA - dueB;

    const createdA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return createdB - createdA;
  });
}

function payloadBelongsToProject(payload, projectId) {
  const item =
    payload?.task ||
    payload?.data?.task ||
    payload?.data ||
    payload?.payload ||
    payload;

  const payloadProjectId = getTaskProjectId(item);

  // Some socket events do not include projectId. In that case, refresh safely.
  if (!payloadProjectId) return true;

  return payloadProjectId === normalizeId(projectId);
}

export function useStackTasks({
  projectId,
  assigneeId,
  limit = 10,
  socket = null,
  enabled = true,
  pollMs = 10000,
} = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled && projectId));
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const normalizedProjectId = normalizeId(projectId);

    if (!enabled || !normalizedProjectId) {
      setTasks([]);
      setLoading(false);
      setError(null);
      return [];
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);

    try {
      // Use the project-wide endpoint so every project member sees the same task queue.
      const payload = await listTasks(normalizedProjectId, {});
      const rawTasks = unwrapTasks(payload);

      const normalizedAssigneeId = normalizeId(assigneeId);
      const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0
        ? Number(limit)
        : 10;

      let nextTasks = rawTasks
        .filter((task) => {
          const taskProjectId = getTaskProjectId(task);
          return !taskProjectId || taskProjectId === normalizedProjectId;
        })
        .filter(isStackTask);

      if (normalizedAssigneeId) {
        nextTasks = nextTasks.filter(
          (task) => getTaskAssigneeId(task) === normalizedAssigneeId
        );
      }

      nextTasks = sortStackTasks(nextTasks).slice(0, safeLimit);

      if (requestIdRef.current === requestId) {
        setTasks(nextTasks);
      }

      return nextTasks;
    } catch (err) {
      if (requestIdRef.current === requestId) {
        setError(err);
      }

      return [];
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [projectId, assigneeId, limit, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled || !projectId || !socket) return undefined;

    const events = [
      "taskCreated",
      "taskUpdated",
      "taskDeleted",
      "taskCompleted",
      "taskMoved",
      "task:created",
      "task:updated",
      "task:deleted",
      "task:completed",
      "task:moved",
      "projectUpdated",
      "project:updated",
    ];

    const handleTaskSignal = (payload) => {
      if (payloadBelongsToProject(payload, projectId)) {
        refresh();
      }
    };

    events.forEach((eventName) => {
      socket.on?.(eventName, handleTaskSignal);
    });

    return () => {
      events.forEach((eventName) => {
        socket.off?.(eventName, handleTaskSignal);
      });
    };
  }, [enabled, projectId, socket, refresh]);

  useEffect(() => {
    if (!enabled || !projectId || !pollMs) return undefined;

    const intervalId = window.setInterval(() => {
      refresh();
    }, pollMs);

    return () => window.clearInterval(intervalId);
  }, [enabled, projectId, pollMs, refresh]);

  return {
    tasks,
    loading,
    error,
    refresh,
    setTasks,
  };
}

export default useStackTasks;
