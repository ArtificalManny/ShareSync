// src/lib/api/messages.ts
// Re-exports from api/messages.js for TypeScript compatibility

// Import the default export explicitly, then re-export it as both
// the default export and the named `messagesApi` export.

// @ts-ignore - JS module without complete type declarations
import messagesApi from '../../api/messages';

// @ts-ignore - JS module without complete type declarations
export {
  getConversationDisplayName,
  getOtherParticipant,
  isOwnMessage,
  getUserInitials,
  generateClientMessageId,
} from '../../api/messages';

export { messagesApi };
export default messagesApi;
