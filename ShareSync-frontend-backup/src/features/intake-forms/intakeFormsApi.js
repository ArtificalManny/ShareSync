import client from "../../api/client";

function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

export function getIntakeApiError(
  error,
  fallback = "The Intake request failed."
) {
  const payload = error?.response?.data;

  if (Array.isArray(payload?.message)) {
    return payload.message.join(" ");
  }

  return (
    payload?.message ||
    payload?.error ||
    error?.message ||
    fallback
  );
}

export async function listIntakeForms(projectId) {
  if (!projectId) throw new Error("projectId is required");

  const response = await client.get(
    `/projects/${projectId}/intake-forms`
  );

  const data = unwrap(response);
  return Array.isArray(data) ? data : [];
}

export async function getIntakeForm(
  projectId,
  formId
) {
  if (!projectId) throw new Error("projectId is required");
  if (!formId) throw new Error("formId is required");

  const response = await client.get(
    `/projects/${projectId}/intake-forms/${formId}`
  );

  return unwrap(response);
}

export async function createIntakeForm(
  projectId,
  payload
) {
  if (!projectId) throw new Error("projectId is required");

  const response = await client.post(
    `/projects/${projectId}/intake-forms`,
    payload
  );

  return unwrap(response);
}

export async function updateIntakeForm(
  projectId,
  formId,
  payload
) {
  if (!projectId) throw new Error("projectId is required");
  if (!formId) throw new Error("formId is required");

  const response = await client.patch(
    `/projects/${projectId}/intake-forms/${formId}`,
    payload
  );

  return unwrap(response);
}

export async function setIntakeFormEnabled(
  projectId,
  formId,
  enabled
) {
  if (!projectId) throw new Error("projectId is required");
  if (!formId) throw new Error("formId is required");

  const response = await client.patch(
    `/projects/${projectId}/intake-forms/${formId}/enabled`,
    { enabled: Boolean(enabled) }
  );

  return unwrap(response);
}

export async function deleteIntakeForm(
  projectId,
  formId
) {
  if (!projectId) throw new Error("projectId is required");
  if (!formId) throw new Error("formId is required");

  await client.delete(
    `/projects/${projectId}/intake-forms/${formId}`
  );

  return true;
}

export async function listIntakeSubmissions(
  projectId,
  formId,
  status
) {
  if (!projectId) throw new Error("projectId is required");
  if (!formId) throw new Error("formId is required");

  const response = await client.get(
    `/projects/${projectId}/intake-forms/${formId}/submissions`,
    {
      params: status ? { status } : undefined,
    }
  );

  const data = unwrap(response);
  return Array.isArray(data) ? data : [];
}

export async function getIntakeSubmission(
  projectId,
  formId,
  submissionId
) {
  if (!projectId) throw new Error("projectId is required");
  if (!formId) throw new Error("formId is required");
  if (!submissionId) {
    throw new Error("submissionId is required");
  }

  const response = await client.get(
    `/projects/${projectId}/intake-forms/${formId}/submissions/${submissionId}`
  );

  return unwrap(response);
}

export async function updateIntakeSubmissionStatus(
  projectId,
  formId,
  submissionId,
  status
) {
  const response = await client.patch(
    `/projects/${projectId}/intake-forms/${formId}/submissions/${submissionId}/status`,
    { status }
  );

  return unwrap(response);
}

export async function convertIntakeSubmission(
  projectId,
  formId,
  submissionId,
  payload = {}
) {
  const response = await client.post(
    `/projects/${projectId}/intake-forms/${formId}/submissions/${submissionId}/convert`,
    payload
  );

  return unwrap(response);
}

export async function getPublicIntakeForm(slug) {
  if (!slug) throw new Error("slug is required");

  const response = await client.get(
    `/public/intake-forms/${encodeURIComponent(slug)}`
  );

  return unwrap(response);
}

export async function submitPublicIntakeForm(
  slug,
  answers
) {
  if (!slug) throw new Error("slug is required");

  const response = await client.post(
    `/public/intake-forms/${encodeURIComponent(slug)}/submissions`,
    { answers }
  );

  return unwrap(response);
}
