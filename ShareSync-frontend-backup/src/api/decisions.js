import api from "./client";

function unwrap(response) {
  return (
    response?.data?.data ??
    response?.data ??
    response
  );
}

export async function getProjectDecisions(
  projectId
) {
  if (!projectId) {
    throw new Error(
      "projectId is required"
    );
  }

  const response = await api.get(
    `/projects/${projectId}/decisions`
  );

  const data = unwrap(response);

  return Array.isArray(data)
    ? data
    : [];
}

export async function createProjectDecision(
  projectId,
  payload = {}
) {
  if (!projectId) {
    throw new Error(
      "projectId is required"
    );
  }

  const response = await api.post(
    `/projects/${projectId}/decisions`,
    payload
  );

  return unwrap(response);
}

export async function updateProjectDecision(
  projectId,
  decisionId,
  updates = {}
) {
  if (!projectId) {
    throw new Error(
      "projectId is required"
    );
  }

  if (!decisionId) {
    throw new Error(
      "decisionId is required"
    );
  }

  const response = await api.patch(
    `/projects/${projectId}/decisions/${decisionId}`,
    updates
  );

  return unwrap(response);
}
