// src/components/frame/GradientPanel.jsx
export default function GradientPanel({ className = "", children }) {
    return (
      <div className={`card rounded-2xl border border-border bg-surface p-4 p-gradient specular ${className}`}>
        {children}
      </div>
    );
  }
  