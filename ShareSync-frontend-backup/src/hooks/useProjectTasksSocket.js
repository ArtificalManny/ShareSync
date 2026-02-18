import { useEffect } from "react";
import { socket, joinProjectRoom, leaveProjectRoom } from "../utils/socket";

/**
 * Call this inside a Project page.
 * - projectId: string
 * - setTasks: React setState for tasks array
 *
 * Expects your tasks to have _id.
 */
export function useProjectTasksSocket(projectId, setTasks) {
  useEffect(() => {
    if (!projectId) return;

    joinProjectRoom(projectId);

    const onTaskUpdated = (task) => {
      setTasks((prev) => {
        if (!Array.isArray(prev)) return prev;
        const idx = prev.findIndex((t) => String(t._id) === String(task._id));
        if (idx === -1) return [task, ...prev]; // new task
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...task };
        return copy;
      });
    };

    const onTaskDeleted = ({ taskId }) => {
      setTasks((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.filter((t) => String(t._id) !== String(taskId));
      });
    };

    socket.on("taskUpdated", onTaskUpdated);
    socket.on("taskDeleted", onTaskDeleted);

    return () => {
      socket.off("taskUpdated", onTaskUpdated);
      socket.off("taskDeleted", onTaskDeleted);
      leaveProjectRoom(projectId);
    };
  }, [projectId, setTasks]);
}
