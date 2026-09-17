import api from "./client";

function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

export async function getProjectApprovals(
  projectId
) {
  const response = await api.get(
    `/projects/${projectId}/approvals`
  );

  return unwrap(response);
}

export async function createProjectApproval(
  projectId,
  payload
) {
  const response = await api.post(
    `/projects/${projectId}/approvals`,
    payload
  );

  return unwrap(response);
}

export async function updateProjectApproval(
  projectId,
  approvalId,
  updates
) {
  const response = await api.patch(
    `/projects/${projectId}/approvals/${approvalId}`,
    updates
  );

  return unwrap(response);
}
