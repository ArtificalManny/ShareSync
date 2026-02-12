// src/routes/AdminRoutes.jsx
// Optional central admin routes.
// If you don’t want this, you can route directly to the page in App.jsx.

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminModerationProjects from "../pages/admin/AdminModerationProjects";

function getStoredUser() {
  try {
    const raw = localStorage.getItem("ss.user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isAdminUser(user) {
  if (!user) return false;
  if (String(user?.role || "").toLowerCase() === "admin") return true;
  if (user?.isAdmin === true) return true;
  if (Array.isArray(user?.roles) && user.roles.map((r) => String(r).toLowerCase()).includes("admin")) return true;
  return false;
}

function AdminGuard({ children }) {
  const user = getStoredUser();
  if (!isAdminUser(user)) return <Navigate to="/" replace />;
  return children;
}

export default function AdminRoutes() {
  return (
    <AdminGuard>
      <Routes>
        <Route path="moderation/projects" element={<AdminModerationProjects />} />
        <Route path="*" element={<Navigate to="moderation/projects" replace />} />
      </Routes>
    </AdminGuard>
  );
}
