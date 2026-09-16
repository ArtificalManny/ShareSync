import api from "./client";

function unwrap(response) {
  return (
    response?.data?.data ??
    response?.data ??
    response
  );
}

export async function getProjectCommitments(
  projectId
) {
  if (!projectId) {
    throw new Error(
      "projectId is required"
    );
  }

  const response = await api.get(
    `/projects/${projectId}/commitments`
  );

  const data = unwrap(response);

  return Array.isArray(data)
    ? data
    : [];
}

export async function createProjectCommitment(
  projectId,
  payload = {}
) {
  if (!projectId) {
    throw new Error(
      "projectId is required"
    );
  }

  const response = await api.post(
    `/projects/${projectId}/commitments`,
    payload
  );

  return unwrap(response);
}

export async function updateProjectCommitment(
  projectId,
  commitmentId,
  updates = {}
) {
  if (!projectId) {
    throw new Error(
      "projectId is required"
    );
  }

  if (!commitmentId) {
    throw new Error(
      "commitmentId is required"
    );
  }

  const response = await api.patch(
    `/projects/${projectId}/commitments/${commitmentId}`,
    updates
  );

  return unwrap(response);
}
