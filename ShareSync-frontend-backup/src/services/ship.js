// src/services/ship.js
import client from "../api/client";
import { track } from "../utils/telemetry";

/**
 * Share a project to Discover feed
 */
export async function shareToDiscover(projectId) {
  if (!projectId) throw new Error("Project ID required");

  try {
    await client.post(`/projects/${projectId}/ship`);
    track("project_shipped_to_discover", { projectId });
  } catch (err) {
    console.error("Failed to ship project", err);
    throw err;
  }
}

// Track ship button click
export function trackShipClicked(projectId) {
  track("ship_clicked", { projectId });
}