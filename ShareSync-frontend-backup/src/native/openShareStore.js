import { registerPlugin } from '@capacitor/core';

// openshare-storekit-js-bridge-v1
export const OpenShareStore = registerPlugin('OpenShareStore');

export const OPENSHARE_TEAM_STOREKIT_PRODUCTS = Object.freeze({
  monthly: 'ca.openshare.team.monthly',
  yearly: 'ca.openshare.team.yearly',
});

// openshare-storekit-server-activation-v1
// Apple-supported subscription management destination.
export const OPENSHARE_APPLE_SUBSCRIPTIONS_MANAGE_URL =
  'https://apps.apple.com/account/subscriptions';

export default OpenShareStore;
