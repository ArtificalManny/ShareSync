// Simple, tree-shakable flags. Read once at startup.
export const FF = {
    INVITES:       process.env.VITE_FF_INVITES === "1",
    FILES:         process.env.VITE_FF_FILES === "1",
    TASKS:         process.env.VITE_FF_TASKS === "1",
    ICONS:         process.env.VITE_FF_ICONS === "1",
    KPIS:          process.env.VITE_FF_KPIS === "1",
    FEED:          process.env.VITE_FF_FEED === "1",
    TRANSPARENCY:  process.env.VITE_FF_TRANSPARENCY === "1",
    HABITS:        process.env.VITE_FF_HABITS === "1",
  } as const;
  