// src/api/messages.d.ts
// ----------------------------------------------------------------------------
// Type declarations for src/api/messages.js
// This is a TS shim so TS re-export modules can import the JS api.
// Keep runtime implementation in messages.js.
// ----------------------------------------------------------------------------

declare const messagesApi: any;
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

