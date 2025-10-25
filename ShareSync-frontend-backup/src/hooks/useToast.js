// src/hooks/useToast.js
// Thin convenience wrapper around the event-based API exported by toast.jsx
import { toast as rawToast } from "../components/ui/toast";

// Usage:
//   const toast = useToast();
//   toast.success("Task created");
//   toast.error({ title: "Oops", description: "Try again." });
export default function useToast() {
  const api = (opts) => rawToast(opts);
  api.success = (msg, opts) => rawToast.success(msg, opts);
  api.error   = (msg, opts) => rawToast.error(msg, opts);
  api.info    = (msg, opts) => rawToast.info(msg, opts);
  return api;
}
