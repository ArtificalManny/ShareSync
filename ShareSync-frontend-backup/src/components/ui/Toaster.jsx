// src/components/ui/Toaster.jsx
import React from "react";
import ToastHost, { toast as rawToast } from "./toast";

export function toast(opts = {}) {
  return rawToast({ ...opts });
}

export function toastXp({ amount = 10, reason = "on-time completion" } = {}) {
  const title = `+${amount} XP`;
  const description = `Awarded for ${reason}.`;
  
  rawToast({
    title,
    description,
    variant: "xp", // Maps to the new glowing premium style in toast.jsx
  });
}

export default function Toaster() {
  return <ToastHost />;
}

export { ToastHost };
