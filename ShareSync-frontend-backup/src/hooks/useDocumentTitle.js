import { useEffect } from "react";

const SUFFIX = " — OpenShare";

export default function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return;
    const prev = document.title;
    document.title = title === "OpenShare" ? "OpenShare" : title + SUFFIX;
    return () => { document.title = prev; };
  }, [title]);
}
