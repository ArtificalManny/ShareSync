/* Notifications service
   - Polls /api/notifications?since=…
   - Normalizes items
   - Exposes a singleton client with subscribe/start/stop/getItems
   - Optimistic actions are done in the component via useOptimisticMutation
*/
import { sendOrQueue } from "../utils/offlineQueue";

export type InboxItem = {
  id: string;
  type: "assignment" | "mention" | "due_soon" | "system";
  title: string;
  body?: string;
  ts: number;           // epoch ms
  read?: boolean;
  snoozeUntil?: number; // epoch ms
  projectId?: string;
  taskId?: string;
  actor?: { name?: string; avatarUrl?: string };
};

function normalize(raw: any): InboxItem {
  const id = String(raw?.id ?? raw?._id ?? Math.random().toString(36).slice(2));
  const type = String(raw?.type || "system") as InboxItem["type"];
  const ts = Number(raw?.ts ?? raw?.createdAt ?? Date.now());
  return {
    id,
    type: (["assignment", "mention", "due_soon"].includes(type) ? type : "system") as InboxItem["type"],
    title: raw?.title || raw?.subject || "Notification",
    body: raw?.body || raw?.snippet || "",
    ts,
    read: Boolean(raw?.read),
    projectId: raw?.projectId || raw?.project_id,
    taskId: raw?.taskId || raw?.task_id,
    actor: raw?.actor || undefined,
  };
}

async function fetchNotifications(since?: number): Promise<InboxItem[]> {
  const qs = since ? `?since=${encodeURIComponent(String(since))}` : "";
  const res = await fetch(`/api/notifications${qs}`);
  if (!res.ok) throw new Error(`Failed to fetch notifications (${res.status})`);
  const json = await res.json();
  const arr = Array.isArray(json?.items) ? json.items : Array.isArray(json) ? json : [];
  return arr.map(normalize).sort((a, b) => b.ts - a.ts);
}

/* In-memory store + subscribers */
type Listener = (items: InboxItem[]) => void;

class NotificationsClient {
  private items: InboxItem[] = [];
  private listeners: Set<Listener> = new Set();
  private timer: number | null = null;
  private intervalMs = 20_000;

  getItems() { return this.items; }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    // immediate push
    fn(this.items);
    return () => this.listeners.delete(fn);
  }

  private emit() { this.listeners.forEach((fn) => fn(this.items)); }

  setIntervalMs(ms: number) { this.intervalMs = Math.max(5_000, ms); }

  async fetchLatest() {
    const since = this.items.length ? Math.max(...this.items.map((i) => i.ts)) : undefined;
    const rows = await fetchNotifications(since);
    if (rows.length) {
      const seen = new Set(this.items.map((i) => i.id));
      const merged = [...rows.filter((r) => !seen.has(r.id)), ...this.items];
      // Keep only recent ~300
      this.items = merged
      .sort((a: InboxItem, b: InboxItem) => b.ts - a.ts)
      .slice(0, 300);
    }
  }

  start() {
    if (this.timer != null) return;
    // initial attempt
    this.fetchLatest().catch(() => {});
    this.timer = (setInterval(() => {
      this.fetchLatest().catch(() => {});
    }, this.intervalMs) as unknown) as number;
  }

  stop() {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Convenience server actions (can be used directly if desired)
  async markRead(id: string) {
    const spec = { url: `/api/notifications/${id}/read`, method: "POST" as const };
    const res = await sendOrQueue(spec);
    // Update local cache optimistically if not already
    this.items = this.items.map((i) => (i.id === id ? { ...i, read: true } : i));
    this.emit();
    return res;
  }

  async snooze(id: string, minutes = 60) {
    const until = Date.now() + minutes * 60 * 1000;
    const spec = { url: `/api/notifications/${id}/snooze`, method: "POST" as const, body: { minutes } };
    const res = await sendOrQueue(spec);
    this.items = this.items.map((i) => (i.id === id ? { ...i, snoozeUntil: until } : i));
    this.emit();
    return res;
  }
}

export const defaultClient = new NotificationsClient();

// Expose for debugging in dev
// @ts-ignore
if (typeof window !== "undefined") window.__SS_NOTIFICATIONS__ = defaultClient;