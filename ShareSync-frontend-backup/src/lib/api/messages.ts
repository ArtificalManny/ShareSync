// src/lib/api/messages.ts
// Re-exports from api/messages.js for TypeScript compatibility

// @ts-ignore - JS module without type declarations
export {
  messagesApi,
  getConversationDisplayName,
  getOtherParticipant,
  isOwnMessage,
  getUserInitials,
  generateClientMessageId,
} from '../../api/messages';

// @ts-ignore
export { default } from '../../api/messages';
