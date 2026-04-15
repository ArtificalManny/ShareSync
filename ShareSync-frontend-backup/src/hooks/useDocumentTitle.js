import { useEffect } from "react";

/**
 * useDocumentTitle - Custom hook for dynamic browser tab routing.
 * * @param {string} title - The specific page name (e.g., "Home", "Snicker's bar")
 */
export default function useDocumentTitle(title) {
  useEffect(() => {
    // The fallback name for your app (used on Login/Register or if no title is passed)
    const baseTitle = "OpenShare";

    // ─────────────────────────────────────────────────────────────────
    // THE FORMATTER
    // Right now, this just outputs exactly what you pass in (e.g., "Home").
    // If you ever want to change the global architecture to "Home | OpenShare",
    // simply change this line to: 
    // const formattedTitle = title && title !== baseTitle ? `${title} | ${baseTitle}` : baseTitle;
    // ─────────────────────────────────────────────────────────────────
    const formattedTitle = title || baseTitle;

    // Apply the title to the browser tab
    document.title = formattedTitle;

  }, [title]); // Only re-runs if the 'title' variable actually changes
}
