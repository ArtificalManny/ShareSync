from pathlib import Path

path = Path("src/context/SocketContext.jsx")

if not path.exists():
    raise SystemExit(f"File not found: {path}")

text = path.read_text()

anchor = """      'activity:new': (data) => eventHandlers['activity:new']?.forEach((h) => h(data)),
      'team:activity_updated': (data) => eventHandlers['team:activity_updated']?.forEach((h) => h(data)),
      'task:update': (data) => eventHandlers['task:update']?.forEach((h) => h(data)),"""

replacement = """      'activity:new': (data) => eventHandlers['activity:new']?.forEach((h) => h(data)),
      'team:activity_updated': (data) => eventHandlers['team:activity_updated']?.forEach((h) => h(data)),
      activityCreated: (data) => eventHandlers.activityCreated?.forEach((h) => h(data)),
      'activity:created': (data) => eventHandlers['activity:created']?.forEach((h) => h(data)),

      'user:velocity-updated': (data) => eventHandlers['user:velocity-updated']?.forEach((h) => h(data)),
      'velocity:updated': (data) => eventHandlers['velocity:updated']?.forEach((h) => h(data)),
      'stats:updated': (data) => eventHandlers['stats:updated']?.forEach((h) => h(data)),
      'streak:update': (data) => eventHandlers['streak:update']?.forEach((h) => h(data)),
      'momentum:update': (data) => eventHandlers['momentum:update']?.forEach((h) => h(data)),

      taskCompleted: (data) => {
        queryClient.invalidateQueries({ queryKey: ['movesToday'] });
        window.dispatchEvent(new CustomEvent('task.completed', { detail: data }));
        eventHandlers.taskCompleted?.forEach((h) => h(data));
        eventHandlers['task.completed']?.forEach((h) => h(data));
      },
      'task:completed': (data) => {
        queryClient.invalidateQueries({ queryKey: ['movesToday'] });
        window.dispatchEvent(new CustomEvent('task.completed', { detail: data }));
        eventHandlers['task:completed']?.forEach((h) => h(data));
        eventHandlers['task.completed']?.forEach((h) => h(data));
      },

      projectCompleted: (data) => {
        window.dispatchEvent(new CustomEvent('project.completed', { detail: data }));
        eventHandlers.projectCompleted?.forEach((h) => h(data));
        eventHandlers['project.completed']?.forEach((h) => h(data));
      },
      'project.completed': (data) => {
        window.dispatchEvent(new CustomEvent('project.completed', { detail: data }));
        eventHandlers['project.completed']?.forEach((h) => h(data));
      },
      'project:lifecycle-updated': (data) => {
        window.dispatchEvent(new CustomEvent('project:lifecycle-updated', { detail: data }));
        eventHandlers['project:lifecycle-updated']?.forEach((h) => h(data));
      },

      'task:update': (data) => eventHandlers['task:update']?.forEach((h) => h(data)),"""

if anchor not in text:
    raise SystemExit("Could not find SocketContext activity/task event anchor.")

text = text.replace(anchor, replacement)

path.write_text(text)
print("Patched SocketContext velocity/task/project event forwarding.")
