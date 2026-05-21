import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const APP_NAME = "OpenShare";

function cleanPath(pathname = "") {
  const cleaned = pathname.replace(/\/+$/, "");
  return cleaned || "/";
}

function getPageTitle(pathname) {
  const path = cleanPath(pathname);

  if (path === "/") return APP_NAME;
  if (path === "/home") return `Home — ${APP_NAME}`;

  // Main app pages
  if (path === "/projects") return `Projects — ${APP_NAME}`;
  if (path === "/discover") return `Discover — ${APP_NAME}`;
  if (path === "/profile") return `Profile — ${APP_NAME}`;
  if (path === "/settings") return `Settings — ${APP_NAME}`;
  if (path === "/messages") return `Messages — ${APP_NAME}`;

  // Auth pages
  if (path === "/login") return `Login — ${APP_NAME}`;
  if (path === "/create-account") return `Create Account — ${APP_NAME}`;
  if (path === "/forgot-password") return `Forgot Password — ${APP_NAME}`;
  if (path === "/reset-password") return `Reset Password — ${APP_NAME}`;
  if (/^\/reset-password\/[^/]+$/.test(path)) return `Reset Password — ${APP_NAME}`;

  // Project subpages
  if (/^\/projects\/[^/]+\/settings$/.test(path)) {
    return `Project Settings — ${APP_NAME}`;
  }

  if (/^\/projects\/[^/]+\/tasks$/.test(path)) {
    return `Project Tasks — ${APP_NAME}`;
  }

  if (/^\/projects\/[^/]+\/board$/.test(path)) {
    return `Project Board — ${APP_NAME}`;
  }

  if (/^\/projects\/[^/]+\/roadmap$/.test(path)) {
    return `Project Roadmap — ${APP_NAME}`;
  }

  if (/^\/projects\/[^/]+\/schedule$/.test(path)) {
    return `Project Schedule — ${APP_NAME}`;
  }

  if (/^\/projects\/[^/]+\/discussion$/.test(path)) {
    return `Project Discussion — ${APP_NAME}`;
  }

  if (/^\/projects\/[^/]+\/files$/.test(path)) {
    return `Project Files — ${APP_NAME}`;
  }

  if (/^\/projects\/[^/]+\/announcements$/.test(path)) {
    return `Project Announcements — ${APP_NAME}`;
  }

  if (/^\/projects\/[^/]+\/insights$/.test(path)) {
    return `Project Insights — ${APP_NAME}`;
  }

  if (/^\/projects\/[^/]+\/next-moves$/.test(path)) {
    return `Project Next Moves — ${APP_NAME}`;
  }

  if (/^\/projects\/[^/]+$/.test(path)) {
    return `Project — ${APP_NAME}`;
  }

  return APP_NAME;
}

export default function PageTitleManager() {
  const location = useLocation();

  useEffect(() => {
    const title = getPageTitle(location.pathname);

    // Set immediately.
    document.title = title;

    // Then set once more after page-level effects run.
    // This prevents Login/Create Account pages from overwriting the route title.
    const timer = window.setTimeout(() => {
      document.title = title;
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return null;
}
