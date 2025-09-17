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
  
  /* ============================================================
   *  Optional: strongly-typed payloads per event (where useful)
   * ============================================================ */
  
  export type ProjectPublicChangedPayload = {
    projectId: string;
    publicEnabled: boolean;
    /** true if a non-empty token exists (the token itself is not broadcast) */
    publicToken: boolean;
  };
  
  export interface SocketEventPayloads {
    "project:publicChanged": ProjectPublicChangedPayload;
  
    // You can fill these as needed elsewhere in the codebase
    "project:membersUpdated"?: any;
    "project:filesAdded"?: any;
    "tasks:created"?: any;
    "tasks:updated"?: any;
    "activity:new"?: any;
  }
  
  /** Helper to derive a payload type by event name */
  export type PayloadOf<Evt extends keyof SocketEventPayloads> =
    SocketEventPayloads[Evt];
  