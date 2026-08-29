/**
 * CursorHeatmap.jsx
 * Cursor activity heatmap visualization
 * 
 * Shows where users spend most time with color-coded density map
 */

import React, { useState, useEffect, useRef } from 'react';
import { Activity, ZoomIn, ZoomOut, Download, Calendar, Filter } from 'lucide-react';

export function CursorHeatmap({ projectId, timeWindow = 3600, gridSize = 20 }) {
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);

  // Fetch heatmap data
  useEffect(() => {
    fetchHeatmapData();
  }, [projectId, timeWindow, gridSize]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/cursors/heatmap?projectId=${projectId}&timeWindow=${timeWindow}&gridSize=${gridSize}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();
      setHeatmapData(data);
    } catch (error) {
      console.error('Failed to fetch heatmap:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render heatmap on canvas
  useEffect(() => {
    if (!heatmapData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { grid, gridSize: size } = heatmapData;

    canvas.width = 800;
    canvas.height = 600;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cellWidth = canvas.width / size;
    const cellHeight = canvas.height / size;
    const maxValue = Math.max(...grid.flat());

    // Draw cells
    grid.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value === 0) return;
        const intensity = value / maxValue;
        const hue = (1 - intensity) * 240; // Blue to red
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${0.3 + intensity * 0.7})`;
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
      });
    });
  }, [heatmapData, zoom]);

  const exportHeatmap = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `heatmap-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Activity size={32} color="#8B5CF6" />
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 16 }}>
          Generating heatmap...
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#1E293B', borderRadius: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>
          Cursor Activity Heatmap
        </h2>
        <button onClick={exportHeatmap} style={{ padding: '8px 16px', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          <Download size={16} /> Export
        </button>
      </div>

      <div style={{ background: '#0F172A', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 8 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="Total Points" value={heatmapData?.totalPoints || 0} />
        <StatCard label="Peak Activity" value={Math.max(...(heatmapData?.grid.flat() || [0]))} />
        <StatCard label="Grid Size" value={`${gridSize}×${gridSize}`} />
        <StatCard label="Time Window" value={`${timeWindow / 3600}h`} />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default CursorHeatmap;