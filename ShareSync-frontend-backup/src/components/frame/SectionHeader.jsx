// src/components/frame/SectionHeader.jsx
import React from "react";

export default function SectionHeader({ title, sub, className = "" }) {
  return (
    <div className={className}>
      <h1 className="h-hero">{title}</h1>
      {sub ? <p className="h-sub mt-1">{sub}</p> : null}
    </div>
  );
}
