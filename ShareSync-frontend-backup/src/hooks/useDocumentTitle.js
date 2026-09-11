import { useEffect } from "react";

const SUFFIX = " — OpenShare";

function ensureMeta(name) {
  let node = document.head.querySelector(`meta[name="${name}"]`);
  const created = !node;

  if (!node) {
    node = document.createElement("meta");
    node.setAttribute("name", name);
    document.head.appendChild(node);
  }

  return { node, created };
}

function ensureCanonical() {
  let node = document.head.querySelector('link[rel="canonical"]');
  const created = !node;

  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", "canonical");
    document.head.appendChild(node);
  }

  return { node, created };
}

export default function useDocumentTitle(
  title,
  {
    description,
    canonical,
    robots,
  } = {},
) {
  useEffect(() => {
    if (!title) return undefined;

    const previousTitle = document.title;
    const cleanups = [];

    document.title =
      title === "OpenShare"
        ? "OpenShare"
        : title + SUFFIX;

    if (typeof description === "string" && description.trim()) {
      const { node, created } = ensureMeta("description");
      const previous = node.getAttribute("content");

      node.setAttribute("content", description.trim());

      cleanups.push(() => {
        if (created) {
          node.remove();
        } else if (previous === null) {
          node.removeAttribute("content");
        } else {
          node.setAttribute("content", previous);
        }
      });
    }

    if (typeof robots === "string" && robots.trim()) {
      const { node, created } = ensureMeta("robots");
      const previous = node.getAttribute("content");

      node.setAttribute("content", robots.trim());

      cleanups.push(() => {
        if (created) {
          node.remove();
        } else if (previous === null) {
          node.removeAttribute("content");
        } else {
          node.setAttribute("content", previous);
        }
      });
    }

    if (typeof canonical === "string" && canonical.trim()) {
      const { node, created } = ensureCanonical();
      const previous = node.getAttribute("href");

      node.setAttribute("href", canonical.trim());

      cleanups.push(() => {
        if (created) {
          node.remove();
        } else if (previous === null) {
          node.removeAttribute("href");
        } else {
          node.setAttribute("href", previous);
        }
      });
    }

    return () => {
      document.title = previousTitle;

      for (let i = cleanups.length - 1; i >= 0; i -= 1) {
        cleanups[i]();
      }
    };
  }, [title, description, canonical, robots]);
}
