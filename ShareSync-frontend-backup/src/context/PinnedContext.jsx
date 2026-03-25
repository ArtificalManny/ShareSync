// /src/context/PinnedContext.jsx
// Feature removed. Hollowed out context to prevent import/render crashes in the rest of the app.
import React, { createContext, useContext } from "react";

const emptyContext = {
  items: [],
  pin: () => {},
  unpin: () => {},
  toggle: () => {},
  updateMeta: () => {},
  clearAll: () => {},
  isPinned: () => false,
  get: () => null,
  byKind: () => [],
};

const PinnedContext = createContext(emptyContext);

export const usePinned = () => useContext(PinnedContext);

export function PinnedProvider({ children }) {
  return (
    <PinnedContext.Provider value={emptyContext}>
      {children}
    </PinnedContext.Provider>
  );
}
