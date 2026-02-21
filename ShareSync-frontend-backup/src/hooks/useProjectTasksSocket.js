import { useEffect } from "react";
import { socket, joinProjectRoom, leaveProjectRoom } from "../utils/socket";

export function useProjectTasksSocket(projectId, setTasks) {
  useEffect(() => {
    if (!projectId) return;

    joinProjectRoom(projectId);

    const onTaskUpdated = (payload) => {
      // ✅ Handle your backend tombstone delete shape
      if (payload?.deleted) {
        const deletedId = payload.id || payload._id;
        if (!deletedId) return;

        setTasks((prev) => {
          if (!Array.isArray(prev)) return prev;
          return prev.filter((t) => String(t._id || t.id) !== String(deletedId));
        });
        return;
      }

      const task = payload;

      setTasks((prev) => {
        if (!Array.isArray(prev)) return prev;

        const taskId = String(task._id || task.id);
        const idx = prev.findIndex((t) => String(t._id || t.id) === taskId);

        if (idx === -1) return [task, ...prev];

        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...task };
        return copy;
      });
    };

    socket.on("taskUpdated", onTaskUpdated);

    return () => {
      socket.off("taskUpdated", onTaskUpdated);
      leaveProjectRoom(projectId);
    };
  }, [projectId, setTasks]);
}
