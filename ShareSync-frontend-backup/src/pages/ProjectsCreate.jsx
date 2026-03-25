// src/pages/ProjectsCreate.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import {
  X,
  Plus,
  Shield,
  Globe,
  Sparkles,
  Target,
  Users as UsersIcon,
  Zap,
  AlertTriangle,
  ListChecks,
  Eye,
  MessageSquare,
  Crown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../api/projects";
import { getCurrentSubscription } from "../api/subscriptions";
import { toast } from "../components/ui/toast";
import SmartStart from "../components/projects/SmartStart";
import "./ProjectsCreate.css";

function isValidEmail(email) {
  // Lightweight check (good UX). Backend should still validate.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim().toLowerCase());
}

const PHASE0_PREFS_KEY = "ss:createProject:phase0";

function loadPhase0Prefs() {
  try {
    const raw = localStorage.getItem(PHASE0_PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function savePhase0Prefs(prefs) {
  try {
    localStorage.setItem(PHASE0_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // no-op
  }
}

export default function ProjectsCreate({ onClose, onProjectCreated }) {
  const navigate = useNavigate();

  const formId = "create-project-form"; // ✅ used to bind footer button to form

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("In Progress");
  const [privacy, setPrivacy] = useState("Private");

  // ✅ Phase 0 (UI-only) settings
  const [isListed, setIsListed] = useState(false);
  const [spectatorMode, setSpectatorMode] = useState("view"); // "view" | "suggest"

  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("Member");
  const [members, setMembers] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [smartStartMode, setSmartStartMode] = useState(false);
  const [subData, setSubData] = useState(null);

  // Inline validation
  const [fieldErrors, setFieldErrors] = useState({
    title: "",
    description: "",
    memberEmail: "",
    form: "",
  });

  // ✅ Fetch limits on mount
  useEffect(() => {
    getCurrentSubscription()
      .then((data) => setSubData(data))
      .catch((err) => console.error("Failed to load subscription data", err));
  }, []);

  const projectsUsed = subData?.usage?.projects || 0;
  const projectsLimit = subData?.limits?.projects || -1;
  const isUnlimited = projectsLimit === -1;
  const isAtLimit = !isUnlimited && projectsUsed >= projectsLimit;

  // ✅ Load Phase 0 defaults once (UI-only)
  useEffect(() => {
    const prefs = loadPhase0Prefs();
    if (!prefs) return;

    if (typeof prefs.privacy === "string") setPrivacy(prefs.privacy);
    if (typeof prefs.isListed === "boolean") setIsListed(prefs.isListed);
    if (prefs.spectatorMode === "view" || prefs.spectatorMode === "suggest") {
      setSpectatorMode(prefs.spectatorMode);
    }
  }, []);

  const canSubmit = useMemo(() => {
    return !submitting && !isAtLimit;
  }, [submitting, isAtLimit]);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const addMember = () => {
    const email = memberEmail.trim();

    // Clear previous error
    clearFieldError("memberEmail");

    if (!email) return;

    if (!isValidEmail(email)) {
      setFieldErrors((prev) => ({ ...prev, memberEmail: "Enter a valid email address." }));
      return;
    }

    const exists = members.some((m) => String(m.email).toLowerCase() === email.toLowerCase());
    if (exists) {
      setFieldErrors((prev) => ({ ...prev, memberEmail: "That member is already added." }));
      return;
    }

    setMembers((prev) => [...prev, { email, role: memberRole }]);
    setMemberEmail("");
    setMemberRole("Member");
  };

  const removeMember = (email) => {
    setMembers((prev) => prev.filter((m) => m.email !== email));
  };

  const validate = () => {
    const next = { title: "", description: "", memberEmail: "", form: "" };

    if (!title.trim()) next.title = "Project title is required.";
    if (!description.trim()) next.description = "Description is required.";

    // If user typed an email but didn't click Add, nudge them (optional)
    if (memberEmail.trim() && !isValidEmail(memberEmail.trim())) {
      next.memberEmail = "That email doesn't look valid (or click Add to include it).";
    }

    setFieldErrors(next);
    return !next.title && !next.description && !next.memberEmail;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    if (submitting || isAtLimit) return;

    // Reset form-level error
    setFieldErrors((prev) => ({ ...prev, form: "" }));

    if (!validate()) {
      toast({
        title: "Fix a couple fields",
        description: "Check the highlighted inputs and try again.",
        variant: "error",
      });
      return;
    }

    setSubmitting(true);

    try {
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();

      // ✅ Phase 0: persist UI intent only
      savePhase0Prefs({
        privacy,
        isListed,
        spectatorMode,
        updatedAt: new Date().toISOString(),
      });

      const payload = {
        name: trimmedTitle,
        title: trimmedTitle,
        description: trimmedDescription,
        category: category.trim() || undefined,
        status,
        privacy,
        isPublic: privacy === "Public",
        members,
      };

      const project = await createProject(payload);

      const id = project?._id || project?.id || project?.projectId;
      if (!id) throw new Error("Backend did not return an _id");

      toast({
        title: "Project created",
        description: `"${project.name || project.title || trimmedTitle}" is live.`,
        variant: "success",
      });

      // Let Projects.jsx update instantly (optimistic prepend)
      onProjectCreated?.(project);

      // ✅ Navigate first, then close modal
      navigate(`/projects/${id}`);
      onClose?.();
    } catch (err) {
      const msg =
        err?.normalizedMessage ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create project";

      setFieldErrors((prev) => ({ ...prev, form: msg }));

      toast({
        title: "Create failed",
        description: msg,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Prevent Enter key from submitting unless explicitly on textarea or submit button
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.type !== "submit") {
      e.preventDefault();
    }
  };

  const isPublic = privacy === "Public";

  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-[150]">
      {/* Background Overlay - High-end frosted glass effect */}
      <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/60 backdrop-blur-sm transition-opacity" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="pc-create-modal relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] shadow-2xl shadow-violet-500/10 dark:shadow-none animate-in zoom-in-95 duration-200">
          
          {/* Header - Crisp and Clean */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white">Create New Project</Dialog.Title>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Start building your next big thing</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              aria-label="Close create project dialog"
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <form
            id={formId}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            className="flex-1 overflow-y-auto px-6 py-6 bg-white dark:bg-[#0f172a]"
          >
            <div className="space-y-6">
              {/* Form-level error */}
              {fieldErrors.form ? (
                <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200">Couldn't create project</p>
                      <p className="text-xs text-red-600 dark:text-red-200/80 mt-1">{fieldErrors.form}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ── Mode Toggle: Manual vs Smart Start ── */}
              <section className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      {smartStartMode ? 'Smart Start' : 'Project Basics'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSmartStartMode(prev => !prev)}
                    disabled={submitting || isAtLimit}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      smartStartMode
                        ? 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/20'
                        : 'bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-300 hover:border-violet-300 dark:hover:border-violet-400'
                    }`}
                  >
                    {smartStartMode ? (
                      <>← Manual mode</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5" /> Smart Start</>
                    )}
                  </button>
                </div>

                {smartStartMode ? (
                  <SmartStart
                    persona={null}
                    onCancel={() => setSmartStartMode(false)}
                    onAccept={(results) => {
                      if (results.tasks?.[0]?.title && !title.trim()) {}
                      if (results.timeline) {
                        setDescription(prev => {
                          const aiSummary = `Timeline: ${results.timeline}\n\nAI-generated tasks (${results.tasks.length}):\n${results.tasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`;
                          return prev.trim() ? prev : aiSummary;
                        });
                      }
                      setSmartStartMode(false);
                      toast({
                        title: 'Smart Start applied!',
                        description: `${results.tasks.length} tasks ready. Review and create your project.`,
                        variant: 'success',
                      });
                    }}
                  />
                ) : (
                  <>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                      Project Title <span className="text-violet-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        clearFieldError("title");
                      }}
                      placeholder="e.g., OpenShare Mobile App"
                      className={`w-full rounded-xl border bg-white dark:bg-[#111113] px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500
                        focus:outline-none focus:ring-2 focus:border-transparent transition-all
                        ${fieldErrors.title ? "border-red-400 dark:border-red-500/60 focus:ring-red-500" : "border-slate-300 dark:border-white/10 focus:ring-violet-500"}
                      `}
                      aria-required="true"
                      autoFocus
                      disabled={submitting || isAtLimit}
                    />
                    {fieldErrors.title ? (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.title}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-2">Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., SaaS, Personal, School"
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#111113] px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      disabled={submitting || isAtLimit}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-2">Initial Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#111113] px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      disabled={submitting || isAtLimit}
                    >
                      <option>Not Started</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                      Description <span className="text-violet-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        clearFieldError("description");
                      }}
                      placeholder="What are you building? What problem does it solve? What's your goal?"
                      rows={4}
                      className={`w-full rounded-xl border bg-white dark:bg-[#111113] px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500
                        focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none
                        ${fieldErrors.description ? "border-red-400 dark:border-red-500/60 focus:ring-red-500" : "border-slate-300 dark:border-white/10 focus:ring-violet-500"}
                      `}
                      disabled={submitting || isAtLimit}
                    />
                    {fieldErrors.description ? (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.description}</p>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                        💡 Tip: A clear description helps your team understand the vision
                      </p>
                    )}
                  </div>
                </div>

                </>
                )}
              </section>

              {/* Privacy Settings */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Privacy</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPrivacy("Private")}
                    className={`rounded-xl border px-5 py-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      privacy === "Private"
                        ? "ring-2 ring-violet-500 border-violet-400 dark:border-violet-500/50 bg-violet-50 dark:bg-violet-500/10 shadow-sm"
                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111113] hover:border-violet-300 dark:hover:border-violet-500/50"
                    }`}
                    aria-pressed={privacy === "Private"}
                    disabled={submitting || isAtLimit}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className={`w-5 h-5 ${privacy === "Private" ? "text-violet-600 dark:text-violet-400" : "text-slate-400 dark:text-zinc-500"}`} />
                      <span className="text-base font-semibold text-slate-900 dark:text-white">Private</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Only invited members can view and collaborate
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacy("Public")}
                    className={`rounded-xl border px-5 py-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      privacy === "Public"
                        ? "ring-2 ring-violet-500 border-violet-400 dark:border-violet-500/50 bg-violet-50 dark:bg-violet-500/10 shadow-sm"
                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111113] hover:border-violet-300 dark:hover:border-violet-500/50"
                    }`}
                    aria-pressed={privacy === "Public"}
                    disabled={submitting || isAtLimit}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Globe className={`w-5 h-5 ${privacy === "Public" ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-zinc-500"}`} />
                      <span className="text-base font-semibold text-slate-900 dark:text-white">Public</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Anyone can view read-only status and progress
                    </p>
                  </button>
                </div>

                {/* ✅ Phase 0 controls (UI only) */}
                {isPublic ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111113] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ListChecks className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Public Visibility</p>
                      <span className="text-xs text-slate-500">(Phase 0: UI-only)</span>
                    </div>

                    {/* Listed toggle */}
                    <button
                      type="button"
                      onClick={() => setIsListed((v) => !v)}
                      className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                        isListed
                          ? "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10"
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#1f1f23] hover:border-violet-300 dark:hover:border-violet-500/40"
                      }`}
                      disabled={submitting || isAtLimit}
                      aria-pressed={isListed}
                    >
                      <div className="flex items-center gap-3">
                        <ListChecks className={`w-4 h-4 ${isListed ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-500"}`} />
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Listed in Discover & Search</p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400">
                            If off: project is public, but only visible by direct link (unlisted)
                          </p>
                        </div>
                      </div>
                      <div
                        className={`h-5 w-9 rounded-full p-0.5 transition-all shadow-inner ${
                          isListed ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full bg-white transition-all shadow-sm ${
                            isListed ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </button>

                    {/* Spectator mode */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSpectatorMode("view")}
                        className={`rounded-xl border px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                          spectatorMode === "view"
                            ? "ring-2 ring-violet-500 border-violet-300 dark:border-violet-400/50 bg-violet-50 dark:bg-violet-500/10"
                            : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#1f1f23] hover:border-violet-300 dark:hover:border-violet-500/40"
                        }`}
                        disabled={submitting || isAtLimit}
                        aria-pressed={spectatorMode === "view"}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className={`w-4 h-4 ${spectatorMode === "view" ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-zinc-500"}`} />
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">View-only</p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          Spectators can watch updates but can't post suggestions
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSpectatorMode("suggest")}
                        className={`rounded-xl border px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                          spectatorMode === "suggest"
                            ? "ring-2 ring-violet-500 border-violet-300 dark:border-violet-400/50 bg-violet-50 dark:bg-violet-500/10"
                            : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#1f1f23] hover:border-violet-300 dark:hover:border-violet-500/40"
                        }`}
                        disabled={submitting || isAtLimit}
                        aria-pressed={spectatorMode === "suggest"}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className={`w-4 h-4 ${spectatorMode === "suggest" ? "text-violet-600 dark:text-violet-400" : "text-slate-400 dark:text-zinc-500"}`} />
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Allow suggestions</p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          Spectators can post ideas (subject to moderation later)
                        </p>
                      </button>
                    </div>

                    {/* Copy: approval hint */}
                    {isListed ? (
                      <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400">
                        💡 Listed projects may require approval before appearing in Discover.
                      </p>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400">
                        🔗 Unlisted public projects can still be shared via direct link.
                      </p>
                    )}
                  </div>
                ) : null}
              </section>

              {/* Team Members */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <UsersIcon className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Team Members</h3>
                  <span className="text-xs text-slate-500">(Optional)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_100px] gap-3">
                  <div className="md:col-span-1">
                    <input
                      type="email"
                      value={memberEmail}
                      onChange={(e) => {
                        setMemberEmail(e.target.value);
                        clearFieldError("memberEmail");
                      }}
                      placeholder="teammate@email.com"
                      className={`w-full rounded-xl border bg-white dark:bg-[#111113] px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500
                        focus:outline-none focus:ring-2 focus:border-transparent transition-all
                        ${fieldErrors.memberEmail ? "border-red-400 dark:border-red-500/60 focus:ring-red-500" : "border-slate-300 dark:border-white/10 focus:ring-violet-500"}
                      `}
                      disabled={submitting || isAtLimit}
                    />
                    {fieldErrors.memberEmail ? (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.memberEmail}</p>
                    ) : null}
                  </div>

                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#111113] px-3 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    disabled={submitting || isAtLimit}
                  >
                    <option>Member</option>
                    <option>Manager</option>
                    <option>Viewer</option>
                  </select>

                  <button
                    type="button"
                    onClick={addMember}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-100 dark:bg-violet-500/20 hover:bg-violet-200 dark:hover:bg-violet-500/30 px-3 py-3 text-sm font-semibold text-violet-700 dark:text-violet-300 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    aria-label="Add member"
                    disabled={submitting || isAtLimit}
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {members.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {members.map((m) => (
                      <div
                        key={m.email}
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#111113] border border-slate-200 dark:border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {m.email[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm text-slate-900 dark:text-white font-semibold">{m.email}</span>
                            <span className="text-xs text-slate-500 dark:text-zinc-400 ml-2">({m.role})</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMember(m.email)}
                          className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors"
                          aria-label={`Remove ${m.email}`}
                          disabled={submitting || isAtLimit}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  💡 Tip: You can invite more members after creating the project
                </p>
              </section>
            </div>
          </form>

          {/* Footer - Fixed (outside form) */}
          <div className="flex items-center justify-between gap-3 px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 rounded-b-2xl">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {subData && !isUnlimited ? (
                <span className={isAtLimit ? "text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5" : "flex items-center gap-1.5"}>
                  {isAtLimit ? <AlertTriangle className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />}
                  You have used {projectsUsed} of {projectsLimit} free projects.
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                  Press ESC to cancel
                </span>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>

              {isAtLimit ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/settings");
                  }}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <Crown className="w-4 h-4 inline mr-2" />
                  Upgrade to Team
                </button>
              ) : (
                <button
                  type="submit"
                  form={formId}
                  className={`rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-500/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                    submitting ? "opacity-70 cursor-wait" : "hover:-translate-y-0.5"
                  }`}
                  disabled={!canSubmit}
                >
                  {submitting ? (
                    <>
                      <div className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 inline mr-2" />
                      Create Project
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
