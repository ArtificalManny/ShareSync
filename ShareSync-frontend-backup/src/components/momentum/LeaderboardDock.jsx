// src/components/momentum/LeaderboardDock.jsx
import React, { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import client from "../../api/client";

const LeaderboardDock = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await client.get("/api/stats/leaderboard");
        setUsers(data.slice(0, 10));
      } catch (err) {
        addToast({ title: "Leaderboard unavailable", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addToast]);

  if (loading) {
    return (
      <div className="leaderboard-dock glass p-4">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
        <div className="skeleton-line" />
      </div>
    );
  }

  return (
    <div className="leaderboard-dock glass p-4">
      <h3 className="text-sm font-semibold mb-3">Top 10 Momentum</h3>
      <ol className="space-y-2">
        {users.map((u, i) => (
          <li key={u.id} className="flex items-center gap-2 text-xs">
            <span className="font-bold w-5">#{i + 1}</span>
            <span className="flex-1 truncate">{u.name}</span>
            <span className="font-mono">{u.streak}d</span>
            <Sparkline data={u.last7} />
          </li>
        ))}
      </ol>

      <style jsx>{`
        .skeleton-line {
          height: 12px;
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
          margin: 6px 0;
          animation: pulse 1.5s infinite;
        }
        .skeleton-line.short { width: 60%; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
};

const Sparkline = ({ data }) => {
  const arr = Array.isArray(data) ? data : [1,1,1,1,1,1,1];
  const max = Math.max(...arr, 1);
  const path = arr.map((v, i) => `${i * 8}, ${16 - (v/max)*16}`).join(" ");
  return <svg width="48" height="16"><polyline fill="none" stroke="#ec4899" strokeWidth="1.5" points={path} /></svg>;
};

export default LeaderboardDock;