// /src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { getMe, getPublicUser } from "../api/user";
import formatProfilePicture from "../utils/formatProfilePicture";
import AuditList from "../components/audit/AuditList.jsx";
import { Lock } from "lucide-react";

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

  const isPublicRoute = useMemo(
    () =>
      Boolean(routeUsername) &&
      (location.pathname.startsWith("/u/") ||
        location.pathname.startsWith("/profile/")),
    [routeUsername, location.pathname]
  );

  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [me, setMe] = useState(null);
  const [publicUser, setPublicUser] = useState(null);

  const load = async () => {
    setLoading(true);
    setLocked(false);
    setError("");
    try {
      if (isPublicRoute) {
        const u = await getPublicUser(routeUsername);
        if (u?.publicProfile === false) {
          setLocked(true);
          setPublicUser(null);
        } else {
          setPublicUser(u || null);
        }
      } else {
        const data = await getMe();
        setMe(data || null);
      }
    } catch (e) {
      if (isPublicRoute) {
        // treat unknown users / fetch failures as locked for now
        setLocked(true);
      } else {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          setError("Please sign in to view your profile.");
        } else {
          setError(
            String(e?.message || "Could not load your profile from the server.")
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublicRoute, routeUsername]);

  const Header = ({ user, isOwner }) => {
    const name = user?.firstName || user?.name || "User";
    const at = user?.username ? `@${user.username}` : "";
    const pic = user?.profilePicture || "/default-profile.png";
    const privacy = isOwner
      ? user?.publicProfile
        ? "Public profile"
        : "Private profile"
      : user?.publicProfile
      ? "Public"
      : "Private";

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
    <div className="card accent-activity rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center">
      <div className="flex items-center justify-center mb-2">
        <Lock size={24} className="text-slate-600 dark:text-slate-300" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        This profile is private
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        The owner hasn’t made their profile public.
      </p>
    </div>
  );

  const publicUserId = publicUser?._id || publicUser?.id || null;

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
          <div className="font-medium">Profile failed to load.</div>
          <div className="text-sm opacity-80">{String(error)}</div>
          <button
            onClick={load}
            className="mt-2 inline-flex items-center rounded-lg bg-rose-600 px-3 py-1.5 text-white text-sm hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      ) : isPublicRoute ? (
        locked ? (
          <LockedCard />
        ) : (
          <>
            <Header user={publicUser} isOwner={false} />
            <section className="card accent-activity rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <h3 className="card-header">Recent public activity</h3>
              <div className="mt-2">
                {publicUserId ? (
                  <AuditList
                    scope="user"
                    userId={publicUserId}
                    /* If your API supports a public-only filter, uncomment:
                    publicOnly
                    */
                  />
                ) : (
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    This user was not found.
                  </div>
                )}
              </div>
            </section>
          </>
        )
      ) : (
        <>
          <Header user={me} isOwner />
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card accent-activity rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <h3 className="card-header">Your recent activity</h3>
              <div className="mt-2">
                <AuditList scope="user" />
              </div>
            </div>
            <div className="card accent-kpi rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <h3 className="card-header">Notifications</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Manage in{" "}
                <Link to="/settings" className="text-indigo-600 underline">
                  Settings
                </Link>
                .
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}