export const FF = {
    INVITES:      process.env.FF_INVITES === "1",
    FILES:        process.env.FF_FILES === "1",
    TASKS:        process.env.FF_TASKS === "1",
    ICONS:        process.env.FF_ICONS === "1",
    KPIS:         process.env.FF_KPIS === "1",
    FEED:         process.env.FF_FEED === "1",
    TRANSPARENCY: process.env.FF_TRANSPARENCY === "1",
    HABITS:       process.env.FF_HABITS === "1",
  } as const;
  