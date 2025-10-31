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
      <div className="leaderboard-dock glass">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
        <div className="skeleton-line" />
      </div>
    );
  }

  return (
    <div className="leaderboard-dock glass">
      <h3>Top 10 Momentum</h3>
      <ol>
        {users.map((u, i) => (
          <li key={u.id} className="user">
            <span className="rank">#{i + 1}</span>
            <span className="name">{u.name}</span>
            <span className="streak">{u.streak}d</span>
            <Sparkline data={u.last7} />
          </li>
        ))}
      </ol>

      <style jsx>{`
        .leaderboard-dock {
          position: fixed;
          bottom: 20px;
          left: 20px;
          width: 280px;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 16px;
          color: white;
          font-size: 13px;
          z-index: 1000;
        }
        h3 { margin: 0 0 12px; font-size: 14px; }
        ol { margin: 0; padding: 0; list-style: none; }
        .user {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
        }
        .rank { width: 20px; font-weight: bold; }
        .name { flex: 1; }
        .streak { font-family: monospace; }
        .skeleton-line {
          height: 12px;
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
          margin: 8px 0;
          animation: pulse 1.5s infinite;
        }
        .skeleton-line.short { width: 60%; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
};

// Re-use Sparkline from Home.jsx
const Sparkline = ({ data }) => {
  const arr = Array.isArray(data) ? data : [1,1,1,1,1,1,1];
  const max = Math.max(...arr, 1);
  const path = arr.map((v, i) => `${i * 10}, ${20 - (v/max)*20}`).join(" ");
  return <svg width="60" height="20"><polyline fill="none" stroke="#ec4899" strokeWidth="2" points={path} /></svg>;
};

export default LeaderboardDock;