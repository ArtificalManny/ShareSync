// /src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import client from "../api/client";
import formatProfilePicture from "../utils/formatProfilePicture";

const Avatar = ({ src, alt }) => (
  <img
    src={formatProfilePicture(src)}
    alt={alt || ""}
    className="h-16 w-16 rounded-full object-cover border border-slate-200 dark:border-slate-700"
  />
);

export default function Profile() {
  const { username: routeUsername } = useParams();
  const location = useLocation();

  // public routes are /u/:username or (legacy) /profile/:username
  const isPublicRoute = useMemo(
    () => Boolean(routeUsername) && (location.pathname.startsWith("/u/") || location.pathname.startsWith("/profile/")),
    [routeUsername, location.pathname]
  );

  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [me, setMe] = useState(null);         // owner data for /me
  const [publicUser, setPublicUser] = useState(null); // public data for /u/:username

  useEffect(() => {
    let ignore = false;

    async function run() {
      setLoading(true);
      setLocked(false);
      setError("");

      try {
        if (isPublicRoute) {
          // PUBLIC: /u/:username or /profile/:username
          const res = await client.get(`/users/public/${encodeURIComponent(routeUsername)}`);
          if (ignore) return;

          // If API returns a flag for locked/hidden, respect it
          const u = res.data || {};
          if (u.publicProfile === false) {
            setLocked(true);
            setPublicUser(null);
          } else {
            setPublicUser(u);
          }
        } else {
          // OWNER: /me
          const res = await client.get("/users/me");
          if (ignore) return;
          setMe(res.data || null);
        }
      } catch (e) {
        if (ignore) return;

        // If public route is private or not found, show "locked"
        if (isPublicRoute) {
          setLocked(true);
        } else {
          setError(String(e?.message || e));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [isPublicRoute, routeUsername]);

  // ---------- Render helpers ----------

  const Header = ({ user, isOwner }) => {
    const name = user?.firstName || user?.name || "User";
    const at = user?.username ? `@${user.username}` : "";
    const pic = user?.profilePicture || "/default-profile.png";
    const privacy = isOwner
      ? user?.publicProfile ? "Public profile" : "Private profile"
      : user?.publicProfile ? "Public" : "Private";

    return (
      <div className="flex items-start gap-4">
        <Avatar src={pic} alt={name} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {name}
            </h1>
            {at && <span className="text-slate-500">{at}</span>}
            <span
              className={[
                "ml-2 rounded-full border px-2 py-0.5 text-xs",
                user?.publicProfile
                  ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                  : "border-slate-300 text-slate-600 bg-slate-50",
              ].join(" ")}
              title={privacy}
            >
              {privacy}
            </span>
          </div>

          {user?.bio && (
            <p className="mt-1 text-slate-600 dark:text-slate-300">{user.bio}</p>
          )}

          {isOwner && (
            <div className="mt-3 flex items-center gap-2">
              <Link
                to="/settings"
                className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Edit profile
              </Link>
              <Link
                to="/projects"
                className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                View projects
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  const LockedCard = () => (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center">
      <div className="text-3xl mb-2">🔒</div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        This profile is private
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        The owner hasn’t made their profile public.
      </p>
    </div>
  );

  // ---------- Main render ----------

  return (
    <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 bg-gray-100 dark:bg-gray-800 min-h-screen max-w-5xl mx-auto space-y-6">
      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <div className="animate-pulse flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 w-40" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 w-64" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 w-48" />
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          {String(error)}
        </div>
      ) : isPublicRoute ? (
        locked ? (
          <LockedCard />
        ) : (
          <>
            <Header user={publicUser} isOwner={false} />
            {/* Public sections (add more when available) */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <h3 className="text-sm font-semibold mb-2">Recent activity</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Coming soon.</p>
            </section>
          </>
        )
      ) : (
        <>
          <Header user={me} isOwner />
          {/* Owner-only panels */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <h3 className="text-sm font-semibold mb-2">Your stats</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Coming soon.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <h3 className="text-sm font-semibold mb-2">Notifications</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Manage in <Link to="/settings" className="text-indigo-600 underline">Settings</Link>.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
