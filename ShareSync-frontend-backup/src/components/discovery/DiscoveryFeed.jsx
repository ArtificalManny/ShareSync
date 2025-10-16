// /src/components/discovery/DiscoveryFeed.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getDiscoveryFeed } from "../../api/discovery";
import { rankProjects, explainRank } from "../../utils/discoverRank";
import RankControls from "./RankControls.jsx";
import ProjectCard from "./ProjectCard.jsx";
import { track } from "../../utils/telemetry";

function getWeightsFromQuery() {
  try {
    const u = new URL(window.location.href);
    const w1 = Number(u.searchParams.get("w1"));
    const w2 = Number(u.searchParams.get("w2"));
    const fresh = Number(u.searchParams.get("fresh"));
    return {
      w1: Number.isFinite(w1) ? w1 : 0.6,
      w2: Number.isFinite(w2) ? w2 : 0.3,
      freshness: Number.isFinite(fresh) ? fresh : 0.1,
    };
  } catch {
    return { w1: 0.6, w2: 0.3, freshness: 0.1 };
  }
}

export default function DiscoveryFeed() {
  const [loading, setLoading] = useState(true);
  const [raw, setRaw] = useState([]); // ALWAYS an array
  const [weights, setWeights] = useState(getWeightsFromQuery());

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    getDiscoveryFeed()
      .then((items) => {
        if (ignore) return;
        setRaw(Array.isArray(items) ? items : []);
        try { track("discover_loaded", { count: Array.isArray(items) ? items.length : 0 }); } catch {}
      })
      .catch(() => {
        if (ignore) return;
        setRaw([]); // not undefined
      })
      .finally(() => !ignore && setLoading(false));
    return () => { ignore = true; };
  }, []);

  const ranked = useMemo(() => {
    const arr = Array.isArray(raw) ? raw : [];
    return rankProjects(arr, weights);
  }, [raw, weights]);

  const onWeightsChange = (next) => {
    setWeights(next);
    try { track("discover_weights_changed", { ...next }); } catch {}
  };

  return (
    <div className="space-y-3">
      <RankControls weights={weights} onChange={onWeightsChange} />

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0,1,2,3,4,5].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-4 animate-pulse h-[142px]" />
          ))}
        </div>
      )}

      {!loading && ranked.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted">
          No projects to discover yet.
        </div>
      )}

      {!loading && ranked.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ranked.map((p) => (
            <ProjectCard
              key={p._id || p.id || p.slug || p.name}
              project={p}
              rank={p.__rank?.score ?? 0}
              reason={explainRank(p).reason}
            />
          ))}
        </div>
      )}
    </div>
  );
}
