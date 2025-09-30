// server/utils/email/config/featureFlags.js

// Read a boolean env (supports 1/true/on/yes)
function envBool(name, def = false) {
    const v = process.env[name];
    if (v == null) return def;
    return /^(1|true|on|yes)$/i.test(String(v));
  }
  
  /**
   * Global feature flags (env-gated).
   * You can add more here as needed.
   */
  const FLAGS = {
    MESSENGER_V1: envBool('FEATURE_MESSENGER_V1', true),   // global kill switch for chat
    GLOBAL_SEARCH: envBool('FEATURE_GLOBAL_SEARCH', true),
    DISCOVERABILITY: envBool('FEATURE_DISCOVERABILITY', true),
  };
  
  /**
   * Check if chat/messenger is enabled for a given project.
   * Honors the global flag AND the per-project `chatEnabled` field.
   *
   * @param {object} project Mongoose project doc or lean object
   * @returns {boolean}
   */
  function isMessengerEnabledForProject(project) {
    if (!FLAGS.MESSENGER_V1) return false;
    if (!project) return false;
    if (project.chatEnabled === false) return false;
    return true;
  }
  
  module.exports = {
    FLAGS,
    isMessengerEnabledForProject,
    envBool,
  };
  