// Lightweight service wrapper. Adjust the endpoint to your backend.
import client from "../api/client";

export type AskPayload = {
  scope?: "project" | "list" | "board" | "selection" | string;
  projectId?: string | null;
  items?: any[];
  instruction: string;
  threadId?: string;
};

export type AskResponse = {
  ok: boolean;
  text?: string;
  message?: string;
  threadId?: string;
};

export async function askAssistant(payload: AskPayload): Promise<AskResponse> {
  // Try your primary API route first
  try {
    const res = await client.post("/api/assistant/ask", payload);
    return normalize(res?.data);
  } catch (e: any) {
    // Fallback to a generic /api/ai/ask if your backend uses that
    try {
      const res = await client.post("/api/ai/ask", payload);
      return normalize(res?.data);
    } catch (e2: any) {
      throw new Error(e2?.response?.data?.message || e2?.message || "Assistant request failed");
    }
  }
}

function normalize(data: any): AskResponse {
  if (!data) return { ok: false, message: "Empty response" };
  if (typeof data === "string") return { ok: true, text: data };
  return {
    ok: Boolean(data.ok ?? true),
    text: data.text ?? data.answer ?? data.message ?? "",
    message: data.message,
    threadId: data.threadId ?? data.thread_id ?? undefined,
  };
}
