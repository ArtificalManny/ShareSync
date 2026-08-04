import client from "../../api/client";

function unwrapData(response) {
  const payload = response?.data;

  if (
    payload &&
    typeof payload === "object" &&
    Object.prototype.hasOwnProperty.call(payload, "data")
  ) {
    return payload.data;
  }

  return payload;
}

export async function listFlowRules(projectId) {
  const response = await client.get(
    `/projects/${projectId}/flow-rules`
  );

  const data = unwrapData(response);

  return Array.isArray(data) ? data : [];
}

export async function getFlowRule(projectId, ruleId) {
  const response = await client.get(
    `/projects/${projectId}/flow-rules/${ruleId}`
  );

  return unwrapData(response);
}

export async function createFlowRule(projectId, payload) {
  const response = await client.post(
    `/projects/${projectId}/flow-rules`,
    payload
  );

  return unwrapData(response);
}

export async function updateFlowRule(
  projectId,
  ruleId,
  payload
) {
  const response = await client.patch(
    `/projects/${projectId}/flow-rules/${ruleId}`,
    payload
  );

  return unwrapData(response);
}

export async function setFlowRuleEnabled(
  projectId,
  ruleId,
  enabled
) {
  const response = await client.patch(
    `/projects/${projectId}/flow-rules/${ruleId}/enabled`,
    { enabled }
  );

  return unwrapData(response);
}

export async function deleteFlowRule(projectId, ruleId) {
  await client.delete(
    `/projects/${projectId}/flow-rules/${ruleId}`
  );
}

export async function listFlowRuleExecutions(
  projectId,
  ruleId
) {
  const response = await client.get(
    `/projects/${projectId}/flow-rules/${ruleId}/executions`
  );

  const data = unwrapData(response);

  return Array.isArray(data) ? data : [];
}
