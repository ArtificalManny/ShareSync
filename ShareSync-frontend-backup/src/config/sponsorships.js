// openshare-sponsorship-policy-v1
//
// Stage 1:
//   discover_sidebar is enabled through SponsoredSpotlight.
//
// Stage 2 remains deliberately OFF until Discover has enough
// organic network activity to keep commercial content secondary.

export const DISCOVER_SPONSORSHIP_POLICY = Object.freeze({
  feedEnabled: false,
  minOrganicBeforeSponsor: 6,
  sponsorInterval: 8,
});
