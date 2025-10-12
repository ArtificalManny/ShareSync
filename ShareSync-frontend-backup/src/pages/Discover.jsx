// src/pages/Discover.jsx
import React from 'react';
import { DISCOVERY_V1 } from '../config/flags';
import DiscoveryFeed from '../components/discovery/DiscoveryFeed.jsx';

export default function Discover() {
  if (!DISCOVERY_V1) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card rounded-2xl border border-border bg-surface p-4">
          <div className="text-sm">Discovery is not enabled for this environment.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* ✅ HERO (Step 7.2) */}
      <h1 className="h-hero">Discover</h1>
      <p className="h-sub mt-1">Fresh public projects, ranked by real momentum.</p>

      {/* Feed */}
      <div className="mt-4">
        <DiscoveryFeed />
      </div>
    </div>
  );
}