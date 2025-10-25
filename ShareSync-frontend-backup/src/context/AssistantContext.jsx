import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { askAssistant } from "../services/assistant.ts"; // TS file is fine to import

const AssistantContext = createContext({
  open: false,
  busy: false,
  scope: "project",
  projectId: null,
  items: [],
  draft: "",
  result: "",
  threadId: null,
  openDock: (_opts = {}) => {},
  closeDock: () => {},
  setDraft: (_v) => {},
  run: async (_opts = {}) => {},
});

export function AssistantProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState("project");
  const [projectId, setProjectId] = useState(null);
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState("");
  const [threadId, setThreadId] = useState(null);

  const openDock = useCallback((opts = {}) => {
    setScope(opts.scope || "project");
    setProjectId(opts.projectId || null);
    setItems(Array.isArray(opts.items) ? opts.items : []);
    setDraft(opts.draft || "");
    setResult("");
    setOpen(true);
  }, []);

  const closeDock = useCallback(() => {
    setOpen(false);
    setBusy(false);
    setResult("");
  }, []);

  const run = useCallback(
    async (opts = {}) => {
      if (busy) return;
      setBusy(true);
      try {
        const instruction = (opts.instruction ?? draft ?? "").trim();
        const payload = {
          scope,
          projectId,
          items,
          instruction,
          threadId: threadId || undefined,
        };
        const res = await askAssistant(payload);
        setResult(String(res?.text || res?.message || ""));
        if (res?.threadId) setThreadId(res.threadId);
        return res;
      } catch (e) {
        setResult(`⚠️ ${e?.message || "Assistant failed. Try again."}`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [busy, scope, projectId, items, draft, threadId]
  );

  const value = useMemo(
    () => ({
      open,
      busy,
      scope,
      projectId,
      items,
      draft,
      result,
      threadId,
      openDock,
      closeDock,
      setDraft,
      run,
    }),
    [open, busy, scope, projectId, items, draft, result, threadId, openDock, closeDock, run]
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  return useContext(AssistantContext);
}

export default AssistantContext;
