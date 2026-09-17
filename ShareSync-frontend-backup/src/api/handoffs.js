import api from "./client";

function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

/**
 * GET /projects/:projectId/handoffs
 *
 * Returns all Handoffs visible within a project.
 */
export async function getProjectHandoffs(
  projectId
) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const response = await api.get(
    `/projects/${projectId}/handoffs`
  );

  return unwrap(response);
}

/**
 * POST /projects/:projectId/handoffs
 *
 * payload:
 * {
 *   title,
 *   context,
 *   acceptanceCriteria?,
 *   recipientId,
 *   sourceMoveId?
 * }
 */
export async function createProjectHandoff(
  projectId,
  payload
) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const response = await api.post(
    `/projects/${projectId}/handoffs`,
    payload
  );

  return unwrap(response);
}

/**
 * PATCH /projects/:projectId/handoffs/:handoffId
 *
 * updates:
 * {
 *   status: "accepted" | "declined" | "cancelled",
 *   responseNote?
 * }
 */
export async function updateProjectHandoff(
  projectId,
  handoffId,
  updates
) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  if (!handoffId) {
    throw new Error("handoffId is required");
  }

  const response = await api.patch(
    `/projects/${projectId}/handoffs/${handoffId}`,
    updates
  );

  return unwrap(response);
}

export default {
  getProjectHandoffs,
  createProjectHandoff,
  updateProjectHandoff,
};
