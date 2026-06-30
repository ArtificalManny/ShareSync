// src/utils/forceMovesStartButtonVisibility.js
// Temporary surgical visual override for the Moves Start button.
// This avoids fragile component matching while we identify the exact source component.

const FORCE_ATTR = "data-openshare-start-visibility-forced";

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isProjectPage() {
  return window.location.pathname.includes("/projects/");
}

function isStartButton(button) {
  const text = normalize(button.textContent);
  const aria = normalize(button.getAttribute("aria-label"));
  const title = normalize(button.getAttribute("title"));

  return text === "Start" || aria === "Start" || title === "Start";
}

function styleStartButton(button) {
  if (!button || button.getAttribute(FORCE_ATTR) === "true") return;
  if (!isProjectPage()) return;
  if (!isStartButton(button)) return;

  button.setAttribute(FORCE_ATTR, "true");

  button.style.setProperty("opacity", "1", "important");
  button.style.setProperty("visibility", "visible", "important");
  button.style.setProperty("color", "#ffffff", "important");
  button.style.setProperty("-webkit-text-fill-color", "#ffffff", "important");
  button.style.setProperty("background-color", "#7c3aed", "important");
  button.style.setProperty(
    "background-image",
    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)",
    "important"
  );
  button.style.setProperty("border", "1px solid rgba(196, 181, 253, 0.95)", "important");
  button.style.setProperty(
    "box-shadow",
    "0 14px 34px rgba(124, 58, 237, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.34)",
    "important"
  );
  button.style.setProperty("text-shadow", "0 1px 2px rgba(15, 23, 42, 0.38)", "important");
  button.style.setProperty("min-width", "84px", "important");
  button.style.setProperty("filter", "none", "important");
  button.style.setProperty("mix-blend-mode", "normal", "important");

  button.querySelectorAll("*").forEach((child) => {
    child.style.setProperty("color", "#ffffff", "important");
    child.style.setProperty("-webkit-text-fill-color", "#ffffff", "important");
    child.style.setProperty("stroke", "#ffffff", "important");
    child.style.setProperty("opacity", "1", "important");
    child.style.setProperty("filter", "none", "important");
    child.style.setProperty("mix-blend-mode", "normal", "important");
  });
}

function scanForStartButtons() {
  if (typeof document === "undefined") return;

  document.querySelectorAll("button").forEach(styleStartButton);
}

export function forceMovesStartButtonVisibility() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  scanForStartButtons();

  let frame = null;

  const scheduleScan = () => {
    if (frame) return;

    frame = window.requestAnimationFrame(() => {
      frame = null;
      scanForStartButtons();
    });
  };

  const observer = new MutationObserver(scheduleScan);

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  window.addEventListener("popstate", scheduleScan);
  window.addEventListener("hashchange", scheduleScan);
  window.addEventListener("focus", scheduleScan);

  return () => {
    observer.disconnect();
    window.removeEventListener("popstate", scheduleScan);
    window.removeEventListener("hashchange", scheduleScan);
    window.removeEventListener("focus", scheduleScan);

    if (frame) {
      window.cancelAnimationFrame(frame);
    }
  };
}
