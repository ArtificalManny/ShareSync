// src/components/discovery/DiscoveryFeed.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import Button from "../ui/Button.jsx";
import Chip from "../ui/Chip.jsx";
import ProjectDiscoveryCard from "./ProjectDiscoveryCard.jsx";
import useDiscoverySocket from "../../hooks/useDiscoverySocket.js";
import { getDiscoveryFeed } from "../../api/discovery";
import { track } from "../../utils/telemetry";

export default function DiscoveryFeed() {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  // server-supported filters
  const [mix, setMix] = useState("blended"); // "trending" | "personalized" | "blended"
  const [range, setRange] = useState("7d");  // "7d" | "30d" | "90d"
  const [onlyTransparent, setOnlyTransparent] = useState(false);

  // optional client-side personalization sliders (0..1). These are *hints*.
  const [socialWeight, setSocialWeight] = useState(0.5);   // reactions bias
  const [velocityWeight, setVelocityWeight] = useState(0.5); // velocity bias

  // Telemetry: feed viewed once
  useEffect(() => {
    track("discovery_feed_view");
  }, []);

  const load = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);
      try {
        const params = {
          limit: 20,
          timeRange: range,
          mix,
          personalized: true,
          onlyTransparent,
          // hints (optional)
          socialWeight,
          velocityWeight,
        };
        if (!reset && cursor) params.cursor = cursor;

        const res = await getDiscoveryFeed(params);
        setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
        setCursor(res.nextCursor || null);
      } finally {
        setLoading(false);
      }
    },
    [cursor, mix, range, onlyTransparent, socialWeight, velocityWeight, loading]
  );

  // initial + whenever filters / sliders change
  useEffect(() => {
    load(true);
  }, [mix, range, onlyTransparent, socialWeight, velocityWeight]);

  // Telemetry: batch loaded (fires whenever the list size changes)
  useEffect(() => {
    if (items.length) {
      track("discovery_batch_loaded", { count: items.length });
    }
  }, [items.length]);

  // Live bumps
  useDiscoverySocket(({ projectId, partial }) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== projectId) return it;

        const merged = { ...it, ...partial };

        // Map metrics → signals if provided by bump payload
        if (partial?.metrics) {
          merged.signals = {
            ...it.signals,
            velocityPerWeek:
              partial.metrics.velocityPerWeek ?? it.signals?.velocityPerWeek ?? 0,
            xpGrowth: partial.metrics.xpDelta7d ?? it.signals?.xpGrowth ?? 0,
            reactions: partial.metrics.reactions7d ?? it.signals?.reactions ?? 0,
            transparency: it.transparency ?? it.signals?.transparency ?? 0,
            inactivityHours:
              partial.metrics.updatedAt
                ? Math.max(
                    0,
                    (Date.now() - new Date(partial.metrics.updatedAt).getTime()) /
                      36e5
                  )
                : it.signals?.inactivityHours ?? 0,
          };
          if (partial.metrics.updatedAt) {
            merged.lastActivityAt = new Date(partial.metrics.updatedAt).toISOString();
          }
        }
        return merged;
      })
    );
  });

  // infinite scroll guard
  const guardRef = useRef(null);
  useEffect(() => {
    const el = guardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursor && !loading) load(false);
      },
      { rootMargin: "400px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [cursor, load, loading]);

  return (
    <section className="space-y-4">
      {/* controls */}
      <div className="card rounded-2xl border border-border bg-surface p-3 p-gradient specular">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs text-muted">View</div>
          {["blended", "trending", "personalized"].map((m) => (
            <Chip
              key={m}
              as="button"
              size="sm"
              selected={mix === m}
              onClick={() => setMix(m)}
            >
              {m}
            </Chip>
          ))}

          <div className="ml-2 text-xs text-muted">Range</div>
          {["7d", "30d", "90d"].map((r) => (
            <Chip
              key={r}
              as="button"
              size="sm"
              selected={range === r}
              onClick={() => setRange(r)}
            >
              {r}
            </Chip>
          ))}

          <div className="ml-2 text-xs text-muted">Filters</div>
          <Chip
            as="button"
            size="sm"
            selected={onlyTransparent}
            onClick={() => setOnlyTransparent((v) => !v)}
          >
            transparent
          </Chip>

          <div className="ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => load(true)}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Optional sliders (client-side preference hints) */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-surface/50 p-3">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Social weight (reactions)</span>
              <span className="font-medium">{socialWeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={socialWeight}
              onChange={(e) => setSocialWeight(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="rounded-xl border border-border bg-surface/50 p-3">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Velocity weight</span>
              <span className="font-medium">{velocityWeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={velocityWeight}
              onChange={(e) => setVelocityWeight(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((it) => (
          <ProjectDiscoveryCard key={it.id} data={it} />
        ))}
      </div>

      <div ref={guardRef} />
      {loading && (
        <div className="text-center text-sm text-muted py-2">Loading…</div>
      )}
      {!cursor && !loading && items.length === 0 && (
        <div className="card rounded-2xl border border-border bg-surface p-4">
          No results yet.
        </div>
      )}
    </section>
  );
}
