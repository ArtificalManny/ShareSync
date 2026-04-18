import React, { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import QuickNotesDrawer from "../components/global/QuickNotesDrawer";
import { NotesProvider, useNotes } from "../context/NotesContext";

export default function MainLayout(props) {
  return (
    <NotesProvider>
      <MainLayoutShell {...props} />
    </NotesProvider>
  );
}

function MainLayoutShell({
  sidebar = null,
  navbar = null,
  children,
}) {
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false);
  const { notes } = useNotes();

  const quickNotesCount = notes.length;

  const navbarWithInjectedProps = useMemo(() => {
    if (!navbar || !React.isValidElement(navbar)) {
      return navbar;
    }

    return React.cloneElement(navbar, {
      onOpenQuickNotes: () => setIsQuickNotesOpen(true),
      quickNotesCount,
    });
  }, [navbar, quickNotesCount]);

  return (
    <>
      <div className="main-layout min-h-screen bg-slate-50 dark:bg-[#09090b] transition-colors duration-300">
        {/* ═══════════════════════════════════════════════════════════════════════
            ATMOSPHERIC GLOWS
            Split into Light Mode div and Dark Mode div so inline styles don't clash.
            ═══════════════════════════════════════════════════════════════════════ */}

        {/* --- LIGHT MODE GLOWS --- */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 dark:hidden">
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 100%)",
            }}
          />
          <div
            className="absolute -top-[20%] -left-[15%] w-[50vw] h-[50vw] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div
            className="absolute -bottom-[20%] -right-[15%] w-[45vw] h-[45vw] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(45, 212, 191, 0.04) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
        </div>

        {/* --- DARK MODE GLOWS --- */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 hidden dark:block">
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, #09090b 0%, #111113 50%, #09090b 100%)",
            }}
          />
          <div
            className="absolute -top-[20%] -left-[15%] w-[50vw] h-[50vw] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.03) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div
            className="absolute -bottom-[20%] -right-[15%] w-[45vw] h-[45vw] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(45, 212, 191, 0.02) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            LAYOUT STRUCTURE - No dark borders
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="relative z-10 flex min-h-screen">
          {sidebar && <aside className="flex-shrink-0">{sidebar}</aside>}

          <div className="flex-1 flex flex-col min-w-0">
            {navbarWithInjectedProps && (
              <header className="flex-shrink-0">{navbarWithInjectedProps}</header>
            )}

            <main className="flex-1 overflow-auto">{children || <Outlet />}</main>
          </div>
        </div>
      </div>

      <QuickNotesDrawer
        open={isQuickNotesOpen}
        onClose={() => setIsQuickNotesOpen(false)}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT SECTION COMPONENTS
// Helper components for consistent section styling within the layout
// ═══════════════════════════════════════════════════════════════════════════════

export function PageContainer({ children, className = "" }) {
  return (
    <div className={`max-w-[1600px] mx-auto px-6 py-8 lg:px-10 lg:py-10 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className = "",
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 ${className}`}>
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white transition-colors">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400 transition-colors">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function PageSection({
  title,
  description,
  actions,
  children,
  className = "",
}) {
  return (
    <section className={`mb-8 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 transition-colors">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400 transition-colors">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function ContentCard({
  children,
  className = "",
  hover = true,
  padding = true,
  ...props
}) {
  return (
    <div
      className={`
        bg-white dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-[#27272a]
        shadow-sm transition-all duration-300
        ${hover ? "hover:shadow-lg hover:shadow-violet-500/[0.06] hover:border-violet-200/60 dark:hover:border-violet-500/30" : ""}
        ${padding ? "p-6" : ""}
        ${className}
      `}
      style={{ boxShadow: "0 2px 12px rgba(139, 92, 246, 0.04)" }}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  trend,
  trendDirection = "up",
  icon: Icon,
  className = "",
}) {
  const trendColors = {
    up: "text-emerald-600 dark:text-emerald-400",
    down: "text-red-500 dark:text-red-400",
    neutral: "text-slate-500 dark:text-zinc-400",
  };

  return (
    <ContentCard className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 transition-colors">
            {label}
          </p>
          <p className="text-2xl font-semibold text-slate-800 dark:text-white mt-1 transition-colors">
            {value}
          </p>
          {trend && (
            <p className={`text-sm mt-1 transition-colors ${trendColors[trendDirection]}`}>
              {trendDirection === "up" ? "↑" : trendDirection === "down" ? "↓" : ""}
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center transition-colors">
            <Icon className="w-5 h-5 text-violet-500 dark:text-violet-400" />
          </div>
        )}
      </div>
    </ContentCard>
  );
}
