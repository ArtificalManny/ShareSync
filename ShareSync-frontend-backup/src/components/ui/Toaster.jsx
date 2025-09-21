import React from "react";
import ToastHost, { toast } from "./toast";

// Legacy default export stayed “Toaster”; apps can still import it.
// Prefer: `import { ToastHost, toast } from '../ui/toast'`
export default function Toaster() {
  return <ToastHost />;
}

export { toast };
