// src/routes/publicRoutes.jsx
import React, {
  lazy,
} from "react";
import {
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";

const PublicProject = lazy(() =>
  import("../pages/public/PublicProject.jsx")
);

const PublicIntakeForm = lazy(() =>
  import("../pages/PublicIntakeForm.jsx")
);

function PublicProfileAlias() {
  const { username } = useParams();
  const safeUsername = encodeURIComponent(username || "");

  return <Navigate to={`/profile/${safeUsername}`} replace />;
}

export default function PublicRoutes() {
  return (
    <Routes>
      <Route
        path="forms/:slug"
        element={<PublicIntakeForm />}
      />

      <Route
        path="u/:username"
        element={<PublicProfileAlias />}
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
