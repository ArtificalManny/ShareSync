// src/routes/publicRoutes.jsx
import React, { lazy } from "react";
import { Route } from "react-router-dom";

const PublicProject = lazy(() => import("../pages/public/PublicProject.jsx"));
const PublicProfile = lazy(() => import("../pages/public/PublicProfile.jsx"));

export default function PublicRoutes() {
  return (
    <>
      <Route path="/p/:projectId" element={<PublicProject />} />
      <Route path="/u/:username" element={<PublicProfile />} />
    </>
  );
}