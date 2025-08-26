import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicProject } from '../api/share';
import AvatarGroup from '../components/AvatarGroup.jsx';
import SectionHeader from '../components/ui/SectionHeader.jsx';

export default function PublicProject() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setErr('');
    getPublicProject(token)
      .then((d) => !ignore && setData(d))
      .catch((e) => !ignore && setErr(e?.response?.data?.message || e?.message || 'Failed to load'))
      .finally(() => !ignore && setLoading(false));
    return () => { ignore = true; };
  }, [token]);

  if (loading) {
    return (
      <main id="main" role="main" tabIndex={-1}>
        <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
          <div className="h-24 rounded-2xl bg-white/70 dark:bg-slate-900/70 animate-pulse" />
        </div>
      </main>
    );
  }

  if (err || !data) {
    return (
      <main id="main" role="main" tabIndex={-1}>
        <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-10 max-w-lg mx-auto">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {err || 'Not found'}
          </div>
          <Link to="/projects" className="inline-block mt-3 text-indigo-600">Back to Projects</Link>
        </div>
      </main>
    );
  }

  const p = data.project || {};
  return (
    <main id="main" role="main" tabIndex={-1}>
      <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto space-y-6">
        <section className="card p-5">
          <SectionHeader icon="Share2">Shared Project</SectionHeader>
          <h1 className="mt-2 text-2xl font-semibold">{p.title}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">{p.description}</p>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-600">Status: <span className="font-medium">{p.status || 'Unknown'}</span></div>
            <AvatarGroup users={p.members || []} size={28} max={6} />
          </div>
        </section>

        {/* You can add a public-safe activity list later (if your API exposes one) */}
        <section className="card p-5">
          <SectionHeader icon="Activity">Recent Activity</SectionHeader>
          <p className="text-sm text-slate-500">Public activity feed coming soon.</p>
        </section>
      </div>
    </main>
  );
}
