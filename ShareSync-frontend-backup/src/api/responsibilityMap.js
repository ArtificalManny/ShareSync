import api from "./client";

function unwrap(response) {
  return (
    response?.data?.data ??
    response?.data ??
    null
  );
}

export async function getProjectResponsibilities(
  projectId
) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const response = await api.get(
    `/projects/${projectId}/responsibility-map`
  );

  return unwrap(response);
}

export async function getProjectResponsibility(
  projectId,
  responsibilityId
) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  if (!responsibilityId) {
    throw new Error(
      "responsibilityId is required"
    );
  }

  const response = await api.get(
    `/projects/${projectId}/responsibility-map/${responsibilityId}`
  );

  return unwrap(response);
}

export async function createProjectResponsibility(
  projectId,
  payload
) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const response = await api.post(
    `/projects/${projectId}/responsibility-map`,
    payload
  );

  return unwrap(response);
}

export async function updateProjectResponsibility(
  projectId,
  responsibilityId,
  updates
) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  if (!responsibilityId) {
    throw new Error(
      "responsibilityId is required"
    );
  }

  const response = await api.patch(
    `/projects/${projectId}/responsibility-map/${responsibilityId}`,
    updates
  );

  return unwrap(response);
}

export default {
  getProjectResponsibilities,
  getProjectResponsibility,
  createProjectResponsibility,
  updateProjectResponsibility,
};
