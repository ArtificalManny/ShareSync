// src/context/FocusContext.jsx
import React, { createContext, useContext, useMemo, useRef, useEffect, useState } from "react";

const FocusCtx = createContext(null);
export const useFocus = () => useContext(FocusCtx);

export const FocusProvider = ({ children }) => {
  const [state, setState] = useState({ status: "idle", remaining: 25 * 60 });
  const t = useRef(null);

  useEffect(() => () => clearInterval(t.current), []);

  const api = useMemo(
    () => ({
      state,
      start: (minutes = 25) => {
        clearInterval(t.current);
        setState({ status: "running", remaining: minutes * 60 });
        t.current = setInterval(() => {
          setState((s) => {
            const next = Math.max(0, s.remaining - 1);
            if (next === 0) {
              clearInterval(t.current);
              return { status: "idle", remaining: 25 * 60 };
            }
            return { ...s, remaining: next };
          });
        }, 1000);
      },
      pause: () => {
        clearInterval(t.current);
        setState((s) => ({ ...s, status: "paused" }));
      },
      cancel: () => {
        clearInterval(t.current);
        setState({ status: "idle", remaining: 25 * 60 });
      },
      done: () => {
        clearInterval(t.current);
        setState({ status: "idle", remaining: 25 * 60 });
      },
    }),
    [state]
  );

  return <FocusCtx.Provider value={api}>{children}</FocusCtx.Provider>;
};
