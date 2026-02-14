// src/types/shims.d.ts
// ----------------------------------------------------------------------------
// Global TS shims for JS modules that don't have typings yet.
// This fixes TS7016 ("Could not find a declaration file for module ...").
// ----------------------------------------------------------------------------

declare module '../utils/projectHelpers' {
  export type IdLike =
    | string
    | null
    | undefined
    | { _id?: string; id?: string; projectId?: string }
    | Record<string, any>;

  export type NavigateFn = (path: string) => void;

  export function getProjectId(input: IdLike): string | null;
  export function hasValidProjectId(input: IdLike): boolean;

  export function getProjectPath(projectId: string): string;

  export function navigateToProject(
    navigate: NavigateFn,
    projectIdOrObj: IdLike,
    fallbackPath?: string
  ): void;

  export function normalizeProject<T = any>(project: T): T;
  export function normalizeProjects<T = any>(projects: T[]): T[];
}

declare module '../../api/messages' {
  const messagesApi: any;
  export default messagesApi;

  export const getConversations: (...args: any[]) => any;
  export const getConversation: (...args: any[]) => any;
  export const createConversation: (...args: any[]) => any;
  export const getOrCreateDirectConversation: (...args: any[]) => any;
  export const updateConversationSettings: (...args: any[]) => any;
  export const addParticipant: (...args: any[]) => any;
  export const removeParticipant: (...args: any[]) => any;
  export const leaveConversation: (...args: any[]) => any;

  export const getMessages: (...args: any[]) => any;
  export const sendMessage: (...args: any[]) => any;
  export const editMessage: (...args: any[]) => any;
  export const deleteMessage: (...args: any[]) => any;

  export const getThreadMessages: (...args: any[]) => any;

  export const addReaction: (...args: any[]) => any;
  export const removeReaction: (...args: any[]) => any;

  export const markMessageAsRead: (...args: any[]) => any;
  export const markConversationAsRead: (...args: any[]) => any;
  export const getUnreadCount: (...args: any[]) => any;

  export const searchMessages: (...args: any[]) => any;

  export const getConversationDisplayName: (...args: any[]) => any;
  export const getOtherParticipant: (...args: any[]) => any;
  export const getSenderName: (...args: any[]) => any;

  export const isOwnMessage: (...args: any[]) => any;
  export const getUserInitials: (...args: any[]) => any;

  export const generateClientMessageId: (...args: any[]) => any;
}
