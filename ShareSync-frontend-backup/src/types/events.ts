// src/types/events.ts
export const SOCKET_EVENTS = {
    PROJECT_MEMBERS_UPDATED: "project:membersUpdated",
    PROJECT_FILES_ADDED:     "project:filesAdded",
    TASKS_CREATED:           "tasks:created",
    TASKS_UPDATED:           "tasks:updated",
    ACTIVITY_NEW:            "activity:new",
    PROJECT_PUBLIC_CHANGED:  "project:publicChanged",
  } as const;
  
  export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
  