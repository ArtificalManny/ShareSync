// src/routes/publicRoutes.jsx
import React, {
  lazy,
} from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

const PublicProject = lazy(() =>
  import("../pages/public/PublicProject.jsx")
);

const PublicProfile = lazy(() =>
  import("../pages/public/PublicProfile.jsx")
);

const PublicIntakeForm = lazy(() =>
  import("../pages/PublicIntakeForm.jsx")
);

export default function PublicRoutes() {
  return (
    <Routes>
      <Route
        path="forms/:slug"
        element={<PublicIntakeForm />}
      />

      <Route
        path="u/:username"
        element={<PublicProfile />}
      />

      <Route
        path=":projectId"
        element={<PublicProject />}
      />

      <Route
        index
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}
