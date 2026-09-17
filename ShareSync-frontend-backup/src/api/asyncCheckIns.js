import api from "./client";

function unwrap(response) {
  return (
    response?.data?.data ??
    response?.data ??
    null
  );
}

export async function getProjectAsyncCheckIns(
  projectId
) {
  const response = await api.get(
    `/projects/${projectId}/check-ins`
  );

  return unwrap(response);
}

export async function getProjectAsyncCheckIn(
  projectId,
  checkInId
) {
  const response = await api.get(
    `/projects/${projectId}/check-ins/${checkInId}`
  );

  return unwrap(response);
}

export async function createProjectAsyncCheckIn(
  projectId,
  payload
) {
  const response = await api.post(
    `/projects/${projectId}/check-ins`,
    payload
  );

  return unwrap(response);
}

export async function updateProjectAsyncCheckIn(
  projectId,
  checkInId,
  updates
) {
  const response = await api.patch(
    `/projects/${projectId}/check-ins/${checkInId}`,
    updates
  );

  return unwrap(response);
}

export async function upsertProjectAsyncCheckInResponse(
  projectId,
  checkInId,
  payload
) {
  const response = await api.put(
    `/projects/${projectId}/check-ins/${checkInId}/response`,
    payload
  );

  return unwrap(response);
}
