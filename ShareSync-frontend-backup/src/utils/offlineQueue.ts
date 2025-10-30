/* Lightweight offline queue for POST/PUT/PATCH/DELETE
   - Persists in localStorage
   - Flushes automatically on 'online'
   - Exposes sendOrQueue() for useOptimisticMutation()
*/
export type QueuedRequest = {
    id: string;
    url: string;
    method: "POST" | "PUT" | "PATCH" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
    createdAt: number;
  };
  
  const STORAGE_KEY = "ss.offline.queue.v1";
  
  function loadQueue(): QueuedRequest[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  
  function saveQueue(list: QueuedRequest[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }
  
  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  
  let queue = loadQueue();
  let flushing = false;
  
  export function getQueue(): readonly QueuedRequest[] {
    return queue;
  }
  
  export function enqueue(req: Omit<QueuedRequest, "id" | "createdAt">) {
    const item: QueuedRequest = { ...req, id: uid(), createdAt: Date.now() };
    queue = [ ...queue, item ];
    saveQueue(queue);
    return item.id;
  }
  
  export async function flushQueue() {
    if (flushing) return;
    if (!queue.length) return;
    flushing = true;
  
    try {
      const remaining: QueuedRequest[] = [];
      for (const item of queue) {
        try {
          const res = await fetch(item.url, {
            method: item.method,
            headers: { "Content-Type": "application/json", ...(item.headers || {}) },
            body: item.body != null ? JSON.stringify(item.body) : undefined,
          });
          if (!res.ok) throw new Error(String(res.status));
          // success: drop from queue
        } catch {
          // keep it for later
          remaining.push(item);
        }
      }
      queue = remaining;
      saveQueue(queue);
    } finally {
      flushing = false;
    }
  }
  
  export async function sendOrQueue(spec: Omit<QueuedRequest, "id" | "createdAt">) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueue(spec);
      return { queued: true, offline: true };
    }
    try {
      const res = await fetch(spec.url, {
        method: spec.method,
        headers: { "Content-Type": "application/json", ...(spec.headers || {}) },
        body: spec.body != null ? JSON.stringify(spec.body) : undefined,
      });
      if (!res.ok) throw new Error(String(res.status));
      return { queued: false, offline: false };
    } catch (e) {
      // Network fail → queue and report
      enqueue(spec);
      return { queued: true, offline: true, error: e };
    }
  }
  
  // Auto-flush when connectivity is restored
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      flushQueue();
    });
  }
  
  // Expose for debugging in dev
  // @ts-ignore
  if (typeof window !== "undefined") window.__SS_OFFLINE_QUEUE__ = { getQueue, flushQueue };
  