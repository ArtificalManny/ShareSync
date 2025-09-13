export const SOCKET_EVENTS = {
    // Project membership / invites
    PROJECT_MEMBERS_UPDATED: "project:membersUpdated",
  
    // Files
    PROJECT_FILES_ADDED: "project:filesAdded",
  
    // Tasks
    TASKS_CREATED: "tasks:created",
    TASKS_UPDATED: "tasks:updated",
  
    // Unified feed / activity
    ACTIVITY_NEW: "activity:new",
  
    // Transparency/public page toggles
    PROJECT_PUBLIC_CHANGED: "project:publicChanged",
  } as const;
  export type SocketEvent = keyof typeof SOCKET_EVENTS;
  