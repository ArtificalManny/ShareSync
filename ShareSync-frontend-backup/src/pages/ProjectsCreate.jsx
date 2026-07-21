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
  Crown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../api/projects";
import { sendInvite } from "../api/invites";
import { getCurrentSubscription } from "../api/subscriptions";
import { getSettings } from "../api/settings";
import { toast } from "../components/ui/toast";
import SmartStart from "../components/projects/SmartStart";
import "./ProjectsCreate.css";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { trackFirstProjectCreated } from "../utils/telemetry";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim().toLowerCase());
}

const PHASE0_PREFS_KEY = "ss:createProject:phase0";

function toCreatePrivacy(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "public") return "Public";
  if (normalized === "private") return "Private";
  return null;
}

function toCreateMemberRole(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "admin" || normalized === "manager") return "Manager";
  if (normalized === "viewer") return "Viewer";
  if (normalized === "member") return "Member";
  return null;
}

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

/**
 * Light modal field override.
 * Keeps fields aligned with the site palette while still beating global input overrides.
 */
function modalFieldRef(el) {
  if (!el) return;
  el.style.setProperty("background-color", "#ffffff", "important");
  el.style.setProperty("background", "#ffffff", "important");
  el.style.setProperty("color", "#0f172a", "important");
  el.style.setProperty("border", "1px solid rgba(203, 213, 225, 0.95)", "important");
  el.style.setProperty("box-shadow", "0 1px 2px rgba(15, 23, 42, 0.03)", "important");
  el.style.setProperty("caret-color", "#8b5cf6", "important");
  el.style.setProperty("border-radius", "0.9rem", "important");
}

export default function ProjectsCreate({ onClose, onProjectCreated }) {
  useDocumentTitle("New Project");
  const navigate = useNavigate();

  const formId = "create-project-form";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("In Progress");
  const [privacy, setPrivacy] = useState("Private");

  const [isListed, setIsListed] = useState(false);
  const [spectatorMode, setSpectatorMode] = useState("view");

  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("Member");
  const [defaultMemberRole, setDefaultMemberRole] = useState("Member");
  const [members, setMembers] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [smartStartMode, setSmartStartMode] = useState(false);
  const [subData, setSubData] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({
    title: "",
    description: "",
    memberEmail: "",
    form: "",
  });

  useEffect(() => {
    getCurrentSubscription()
      .then((data) => setSubData(data))
      .catch((err) => console.error("Failed to load subscription data", err));
  }, []);

  const projectsUsed = subData?.usage?.projects || 0;
  const projectsLimit = subData?.limits?.projects || -1;
  const isUnlimited = projectsLimit === -1;
  const isAtLimit = !isUnlimited && projectsUsed >= projectsLimit;

  useEffect(() => {
    let cancelled = false;

    async function applyProjectDefaults() {
      const prefs = loadPhase0Prefs();

      let nextPrivacy = "Private";
      let nextMemberRole = "Member";

      try {
        const settings = await getSettings();
        const defaults = settings?.projectDefaults || {};

        const settingsPrivacy = toCreatePrivacy(defaults.visibility || defaults.defaultVisibility);
        const settingsMemberRole = toCreateMemberRole(defaults.inviteRole || defaults.defaultInviteRole);

        if (settingsPrivacy) nextPrivacy = settingsPrivacy;
        if (settingsMemberRole) nextMemberRole = settingsMemberRole;
      } catch (err) {
        console.warn("Failed to load project defaults", err);
      }

      if (prefs) {
        const savedPrivacy = toCreatePrivacy(prefs.privacy);
        const savedMemberRole = toCreateMemberRole(prefs.memberRole);

        if (savedPrivacy) nextPrivacy = savedPrivacy;
        if (savedMemberRole) nextMemberRole = savedMemberRole;
      }

      if (cancelled) return;

      setPrivacy(nextPrivacy);
      setMemberRole(nextMemberRole);
      setDefaultMemberRole(nextMemberRole);

      if (prefs) {
        if (typeof prefs.isListed === "boolean") setIsListed(prefs.isListed);
        if (prefs.spectatorMode === "view" || prefs.spectatorMode === "suggest") {
          setSpectatorMode(prefs.spectatorMode);
        }
      }
    }

    applyProjectDefaults();

    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(() => {
    return !submitting && !isAtLimit;
  }, [submitting, isAtLimit]);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const addMember = () => {
    const email = memberEmail.trim();
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
    setMemberRole(defaultMemberRole);
  };

  const removeMember = (email) => {
    setMembers((prev) => prev.filter((m) => m.email !== email));
  };

  const validate = () => {
    const next = { title: "", description: "", memberEmail: "", form: "" };

    if (!title.trim()) next.title = "Project title is required.";
    if (!description.trim()) next.description = "Description is required.";

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
      const isProjectPublic = privacy === "Public";
      const normalizedSpectatorMode =
        spectatorMode === "suggest" ? "suggestions" : "view_only";

      savePhase0Prefs({
        privacy,
        isListed,
        spectatorMode,
        memberRole,
        updatedAt: new Date().toISOString(),
      });

      const payload = {
        name: trimmedTitle,
        title: trimmedTitle,
        description: trimmedDescription,
        category: category.trim() || undefined,
        status,

        // Privacy / publishing contract
        // Keep legacy frontend fields while also sending backend-friendly fields.
        privacy,
        visibility: isProjectPublic ? "public" : "private",
        isPublic: isProjectPublic,

        // Discover/Search listing contract
        // Listed only matters for public projects. Private projects must never leak into Discover.
        isListed: isProjectPublic ? Boolean(isListed) : false,
        discoverable: isProjectPublic ? Boolean(isListed) : false,

        // Spectator/public access contract
        // view_only: public viewers can watch only
        // suggestions: public viewers can submit moderated suggestions later
        spectatorMode: isProjectPublic ? normalizedSpectatorMode : "none",
        publicAccessMode: isProjectPublic ? normalizedSpectatorMode : "none",
        suggestionsEnabled: isProjectPublic && normalizedSpectatorMode === "suggestions",

        members,
      };

      const project = await createProject(payload);

      const id = project?._id || project?.id || project?.projectId;
      if (!id) throw new Error("Backend did not return an _id");

      try {
        const flowRaw = sessionStorage.getItem(
          "openshare:first-project-flow",
        );

        if (flowRaw) {
          const flow = JSON.parse(flowRaw);

          trackFirstProjectCreated({
            project_entry_point:
              flow?.project_entry_point || "empty_projects",
            creation_method:
              flow?.creation_method || "blank",
          });

          sessionStorage.removeItem(
            "openshare:first-project-flow",
          );
        }
      } catch {
        // Analytics must never affect successful project creation.
      }

      if (members.length > 0) {
        try {
          await Promise.all(
            members.map((m) => {
              let mappedRole = "member";
              if (m.role === "Manager") mappedRole = "admin";
              if (m.role === "Viewer") mappedRole = "viewer";

              return sendInvite(id, { email: m.email, role: mappedRole });
            })
          );
        } catch (inviteErr) {
          console.warn("Failed to send some invites during project creation:", inviteErr);
        }
      }

      toast({
        title: "Project created",
        description: `"${project.name || project.title || trimmedTitle}" is live.`,
        variant: "success",
      });

      onProjectCreated?.(project);
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.type !== "submit") {
      e.preventDefault();
    }
  };

  const isPublic = privacy === "Public";

  return (
    <Dialog open={true} onClose={submitting ? () => {} : onClose} className="fixed inset-0 z-[10000]">
      <div className="pc-create-backdrop fixed inset-0 bg-black/5 backdrop-blur-[2px]" aria-hidden="true" />

      <div className="pc-create-viewport fixed inset-0 flex items-start justify-center overflow-hidden p-0 pointer-events-none sm:items-center sm:p-6">
        <Dialog.Panel className="pc-create-modal pointer-events-auto relative flex h-[100dvh] min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-none border-0 bg-white shadow-[0_24px_80px_rgba(139,92,246,0.16)] dark:bg-slate-950 sm:h-auto sm:max-h-[85dvh] sm:rounded-[28px] sm:border sm:border-slate-100">
          {/* create-project-dark-header-v1 */}
          <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 pb-5 pt-5 dark:border-white/10 dark:bg-slate-950 sm:rounded-t-[28px] sm:bg-gradient-to-r sm:from-violet-50 sm:via-white sm:to-fuchsia-50/70 dark:sm:from-slate-950 dark:sm:via-slate-900 dark:sm:to-violet-950/80">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-[0_10px_28px_rgba(139,92,246,0.24)]">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-semibold text-slate-900 dark:text-white">
                  Create New Project
                </Dialog.Title>
                <p className="text-sm text-slate-500 dark:text-slate-400">Start building your next big thing</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 transition-colors group hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Close create project dialog"
              disabled={submitting}
            >
              <X className="w-5 h-5 text-slate-400 transition-colors group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-white" />
            </button>
          </div>

          <form
            id={formId}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-6 py-6 [-webkit-overflow-scrolling:touch] dark:bg-slate-950"
          >
            <div className="space-y-6">
              {fieldErrors.form ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700">Couldn't create project</p>
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.form}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <section className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* project-basics-foundation-mark-v1 */}
                    <span
                      className="
                        relative grid h-8 w-8 shrink-0 place-items-center
                        rounded-xl border border-violet-200/90
                        bg-gradient-to-br from-violet-50 via-white to-fuchsia-50
                        shadow-[0_5px_16px_rgba(124,58,237,0.12)]
                        dark:border-violet-400/30
                        dark:from-violet-500/20
                        dark:via-slate-900
                        dark:to-fuchsia-500/20
                        dark:shadow-[0_6px_18px_rgba(124,58,237,0.18)]
                      "
                      aria-hidden="true"
                    >
                      <span className="relative h-[18px] w-[18px]">
                        <span
                          className="
                            absolute left-0 top-0 h-[7px] w-[7px]
                            rounded-[2px] border-2 border-violet-500
                            dark:border-violet-300
                          "
                        />
                        <span
                          className="
                            absolute right-0 top-0 h-[7px] w-[7px]
                            rounded-full bg-fuchsia-500
                            shadow-[0_0_8px_rgba(217,70,239,0.45)]
                            dark:bg-fuchsia-400
                          "
                        />
                        <span
                          className="
                            absolute bottom-0 left-1/2 h-[7px] w-[10px]
                            -translate-x-1/2 rounded-[2px]
                            border-2 border-violet-400
                            dark:border-violet-300
                          "
                        />
                        <span
                          className="
                            absolute left-[4px] right-[4px] top-[8px] h-px
                            bg-gradient-to-r
                            from-violet-400 via-fuchsia-400 to-violet-400
                            opacity-80
                          "
                        />
                      </span>
                    </span>

                    <div>
                      <h3
                        className="
                          text-sm font-bold uppercase tracking-[0.16em]
                          text-slate-800
                          dark:text-slate-100
                        "
                      >
                        {smartStartMode ? "Smart Start" : "Project Basics"}
                      </h3>
                      <p
                        className="
                          mt-0.5 text-[11px] font-medium
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        {smartStartMode
                          ? "Shape your foundation with AI"
                          : "Define the foundation"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSmartStartMode((prev) => !prev)}
                    disabled={submitting || isAtLimit}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      smartStartMode
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100"
                    }`}
                  >
                    {smartStartMode ? (
                      <>← Manual mode</>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Smart Start
                      </>
                    )}
                  </button>
                </div>

                {smartStartMode ? (
                  <SmartStart
                    persona={null}
                    onCancel={() => setSmartStartMode(false)}
                    onAccept={(results) => {
                      if (results.timeline) {
                        setDescription((prev) => {
                          const aiSummary = `Timeline: ${results.timeline}\n\nAI-generated tasks (${results.tasks.length}):\n${results.tasks
                            .map((t, i) => `${i + 1}. ${t.title}`)
                            .join("\n")}`;
                          return prev.trim() ? prev : aiSummary;
                        });
                      }

                      setSmartStartMode(false);
                      toast({
                        title: "Smart Start applied!",
                        description: `${results.tasks.length} tasks ready. Review and create your project.`,
                        variant: "success",
                      });
                    }}
                  />
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Project Title <span className="text-fuchsia-500">*</span>
                        </label>
                        <input
                          ref={modalFieldRef}
                          type="text"
                          value={title}
                          onChange={(e) => {
                            setTitle(e.target.value);
                            clearFieldError("title");
                          }}
                          placeholder="e.g., OpenShare Mobile App"
                          className={`w-full rounded-2xl border px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                            fieldErrors.title
                              ? "border-red-300 focus:ring-red-200"
                              : "border-slate-200 focus:ring-violet-200"
                          }`}
                          aria-required="true"
                          autoFocus
                          disabled={submitting || isAtLimit}
                        />
                        {fieldErrors.title ? (
                          <p className="mt-1 text-xs text-red-500">{fieldErrors.title}</p>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                        <input
                          ref={modalFieldRef}
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="e.g., SaaS, Personal, School"
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-transparent transition-all"
                          disabled={submitting || isAtLimit}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Initial Status</label>
                        <select
                          ref={modalFieldRef}
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-transparent transition-all"
                          disabled={submitting || isAtLimit}
                        >
                          <option>Not Started</option>
                          <option>In Progress</option>
                          <option>Completed</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Description <span className="text-fuchsia-500">*</span>
                        </label>
                        <textarea
                          ref={modalFieldRef}
                          value={description}
                          onChange={(e) => {
                            setDescription(e.target.value);
                            clearFieldError("description");
                          }}
                          placeholder="What are you building? What problem does it solve? What's your goal?"
                          rows={4}
                          className={`w-full rounded-2xl border px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none ${
                            fieldErrors.description
                              ? "border-red-300 focus:ring-red-200"
                              : "border-slate-200 focus:ring-violet-200"
                          }`}
                          disabled={submitting || isAtLimit}
                        />
                        {fieldErrors.description ? (
                          <p className="mt-1 text-xs text-red-500">{fieldErrors.description}</p>
                        ) : (
                          <p className="text-xs text-slate-500 mt-1">
                            💡 Tip: A clear description helps your team understand the vision
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  {/* privacy-access-seal-v1 */}
                  <span
                    className="
                      relative grid h-8 w-8 shrink-0 place-items-center
                      rounded-xl border border-violet-200/90
                      bg-gradient-to-br from-violet-50 via-white to-fuchsia-50
                      shadow-[0_5px_16px_rgba(124,58,237,0.12)]
                      dark:border-violet-400/30
                      dark:from-violet-500/20
                      dark:via-slate-900
                      dark:to-fuchsia-500/20
                      dark:shadow-[0_6px_18px_rgba(124,58,237,0.18)]
                    "
                    aria-hidden="true"
                  >
                    <span className="relative h-[18px] w-[18px]">
                      <span
                        className="
                          absolute left-1/2 top-[1px]
                          h-[8px] w-[10px] -translate-x-1/2
                          rounded-t-full border-2 border-b-0
                          border-violet-500
                          dark:border-violet-300
                        "
                      />
                      <span
                        className="
                          absolute bottom-[1px] left-1/2
                          h-[10px] w-[14px] -translate-x-1/2
                          rounded-[5px] border-2
                          border-violet-400
                          bg-white/70
                          dark:border-violet-300
                          dark:bg-violet-950/50
                        "
                      />
                      <span
                        className="
                          absolute bottom-[4px] left-1/2
                          h-[4px] w-[4px] -translate-x-1/2
                          rounded-full bg-fuchsia-500
                          shadow-[0_0_7px_rgba(217,70,239,0.55)]
                          dark:bg-fuchsia-400
                        "
                      />
                    </span>
                  </span>

                  <div>
                    <h3
                      className="
                        text-sm font-bold uppercase tracking-[0.16em]
                        text-slate-800
                        dark:text-slate-100
                      "
                    >
                      Privacy
                    </h3>
                    <p
                      className="
                        mt-0.5 text-[11px] font-medium
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Set visibility and access
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPrivacy("Private")}
                    className={`rounded-2xl border px-5 py-4 text-left transition-all ${
                      privacy === "Private"
                        ? "ring-2 ring-violet-300 border-violet-300 bg-violet-50 shadow-[0_10px_28px_rgba(139,92,246,0.12)]"
                        : "border-slate-200 bg-white hover:bg-slate-50 hover:border-violet-200"
                    }`}
                    aria-pressed={privacy === "Private"}
                    disabled={submitting || isAtLimit}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-5 h-5 text-violet-500" />
                      <span className="text-base font-semibold text-slate-800">Private</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Only invited members can view and collaborate
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacy("Public")}
                    className={`rounded-2xl border px-5 py-4 text-left transition-all ${
                      privacy === "Public"
                        ? "ring-2 ring-violet-300 border-violet-300 bg-violet-50 shadow-[0_10px_28px_rgba(139,92,246,0.12)]"
                        : "border-slate-200 bg-white hover:bg-slate-50 hover:border-violet-200"
                    }`}
                    aria-pressed={privacy === "Public"}
                    disabled={submitting || isAtLimit}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Globe className="w-5 h-5 text-sky-500" />
                      <span className="text-base font-semibold text-slate-800">Public</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Anyone can view read-only status and progress
                    </p>
                  </button>
                </div>

                {isPublic ? (
                  <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ListChecks className="w-4 h-4 text-violet-500" />
                      <p className="text-sm font-semibold text-slate-800">Public Visibility</p>
                      <span className="text-xs text-slate-500">(Saved with project)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsListed((v) => !v)}
                      className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 transition-all ${
                        isListed
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-200 bg-white hover:bg-slate-50 hover:border-violet-200"
                      }`}
                      disabled={submitting || isAtLimit}
                      aria-pressed={isListed}
                    >
                      <div className="flex items-center gap-3">
                        <ListChecks
                          className={`w-4 h-4 ${isListed ? "text-emerald-500" : "text-slate-500"}`}
                        />
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-800">
                            Listed in Discover & Search
                          </p>
                          <p className="text-xs text-slate-500">
                            If off: project is public, but only visible by direct link (unlisted)
                          </p>
                        </div>
                      </div>

                      <div
                        className={`h-5 w-9 rounded-full p-0.5 transition-all ${
                          isListed ? "bg-emerald-500/70" : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full bg-white transition-all ${
                            isListed ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </button>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSpectatorMode("view")}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                          spectatorMode === "view"
                            ? "ring-2 ring-violet-300 border-violet-300 bg-violet-50"
                            : "border-slate-200 bg-white hover:bg-slate-50 hover:border-violet-200"
                        }`}
                        disabled={submitting || isAtLimit}
                        aria-pressed={spectatorMode === "view"}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="w-4 h-4 text-sky-500" />
                          <p className="text-sm font-semibold text-slate-800">View-only</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          Spectators can watch updates but can't post suggestions
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSpectatorMode("suggest")}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                          spectatorMode === "suggest"
                            ? "ring-2 ring-violet-300 border-violet-300 bg-violet-50"
                            : "border-slate-200 bg-white hover:bg-slate-50 hover:border-violet-200"
                        }`}
                        disabled={submitting || isAtLimit}
                        aria-pressed={spectatorMode === "suggest"}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-4 h-4 text-violet-500" />
                          <p className="text-sm font-semibold text-slate-800">Allow suggestions</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          Spectators can post ideas (subject to moderation later)
                        </p>
                      </button>
                    </div>

                    {isListed ? (
                      <p className="mt-3 text-xs text-slate-500">
                        💡 Listed projects may require approval before appearing in Discover.
                      </p>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">
                        🔗 Unlisted public projects can still be shared via direct link.
                      </p>
                    )}
                  </div>
                ) : null}
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  {/* team-collaboration-mark-v1 */}
                  <span
                    className="
                      relative grid h-8 w-8 shrink-0 place-items-center
                      rounded-xl border border-violet-200/90
                      bg-gradient-to-br from-violet-50 via-white to-sky-50
                      shadow-[0_5px_16px_rgba(124,58,237,0.12)]
                      dark:border-violet-400/30
                      dark:from-violet-500/20
                      dark:via-slate-900
                      dark:to-sky-500/20
                      dark:shadow-[0_6px_18px_rgba(124,58,237,0.18)]
                    "
                    aria-hidden="true"
                  >
                    <span className="relative h-[18px] w-[18px]">
                      <span
                        className="
                          absolute left-[4px] right-[4px] top-[8px]
                          h-px bg-gradient-to-r
                          from-violet-400 via-fuchsia-400 to-sky-400
                          opacity-90
                        "
                      />
                      <span
                        className="
                          absolute left-[5px] top-[6px]
                          h-[9px] w-px rotate-[35deg]
                          bg-violet-400/80
                        "
                      />
                      <span
                        className="
                          absolute right-[5px] top-[6px]
                          h-[9px] w-px -rotate-[35deg]
                          bg-sky-400/80
                        "
                      />
                      <span
                        className="
                          absolute left-1/2 top-0
                          h-[7px] w-[7px] -translate-x-1/2
                          rounded-full border-2 border-violet-500
                          bg-white
                          dark:border-violet-300
                          dark:bg-slate-900
                        "
                      />
                      <span
                        className="
                          absolute bottom-0 left-0
                          h-[7px] w-[7px]
                          rounded-full bg-fuchsia-500
                          shadow-[0_0_7px_rgba(217,70,239,0.45)]
                          dark:bg-fuchsia-400
                        "
                      />
                      <span
                        className="
                          absolute bottom-0 right-0
                          h-[7px] w-[7px]
                          rounded-full bg-sky-500
                          shadow-[0_0_7px_rgba(14,165,233,0.42)]
                          dark:bg-sky-400
                        "
                      />
                    </span>
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className="
                          text-sm font-bold uppercase tracking-[0.16em]
                          text-slate-800
                          dark:text-slate-100
                        "
                      >
                        Team Members
                      </h3>

                      <span
                        className="
                          inline-flex rounded-full
                          border border-violet-200
                          bg-violet-50 px-2 py-0.5
                          text-[10px] font-bold uppercase tracking-[0.08em]
                          text-violet-600
                          dark:border-violet-400/25
                          dark:bg-violet-500/10
                          dark:text-violet-300
                        "
                      >
                        Optional
                      </span>
                    </div>

                    <p
                      className="
                        mt-0.5 text-[11px] font-medium
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Invite collaborators now or later
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_100px] gap-3">
                  <div className="md:col-span-1">
                    <input
                      ref={modalFieldRef}
                      type="email"
                      value={memberEmail}
                      onChange={(e) => {
                        setMemberEmail(e.target.value);
                        clearFieldError("memberEmail");
                      }}
                      placeholder="teammate@email.com"
                      className={`w-full rounded-2xl border px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                        fieldErrors.memberEmail
                          ? "border-red-300 focus:ring-red-200"
                          : "border-slate-200 focus:ring-violet-200"
                      }`}
                      disabled={submitting || isAtLimit}
                    />
                    {fieldErrors.memberEmail ? (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.memberEmail}</p>
                    ) : null}
                  </div>

                  <select
                    ref={modalFieldRef}
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="rounded-2xl border border-slate-200 px-3 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-transparent transition-all"
                    disabled={submitting || isAtLimit}
                  >
                    <option>Member</option>
                    <option>Manager</option>
                    <option>Viewer</option>
                  </select>

                  <button
                    type="button"
                    onClick={addMember}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3 py-3 text-sm font-medium text-violet-700 transition-all"
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
                        className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
                            {m.email[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm text-slate-800 font-medium">{m.email}</span>
                            <span className="text-xs text-slate-500 ml-2">({m.role})</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeMember(m.email)}
                          className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                          aria-label={`Remove ${m.email}`}
                          disabled={submitting || isAtLimit}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  💡 Tip: You can invite more members after creating the project
                </p>
              </section>
            </div>
          </form>

          <div className="pc-create-footer relative z-20 shrink-0 flex flex-col gap-4 border-t border-slate-100 bg-white px-6 pb-5 pt-4 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between sm:rounded-b-[28px] sm:py-5">
            <div className="text-xs">
              {subData && !isUnlimited ? (
                <div className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-medium border ${isAtLimit ? "bg-amber-50 border-amber-200/50 text-amber-700" : "bg-violet-50/50 border-violet-100/50 text-violet-600"}`}>
                  {isAtLimit ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  {isAtLimit ? `Limit reached: ${projectsLimit} free projects` : `Used ${projectsUsed} of ${projectsLimit} free projects`}
                </div>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-400">
                  <Zap className="w-3.5 h-3.5" />
                  Press ESC to cancel
                </span>
              )}
            </div>

            <div className="pc-create-actions grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 transition-all w-full min-w-0 sm:w-auto sm:min-w-[132px]"
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
                  className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-6 py-3 text-sm font-bold text-white shadow-[0_10px_28px_rgba(245,158,11,0.28)] transition-all hover:scale-[1.02]"
                >
                  <Crown className="w-4 h-4 inline mr-2" />
                  Upgrade to Team
                </button>
              ) : (
                <button
                  type="submit"
                  form={formId}
                  className={`pc-create-submit rounded-2xl bg-violet-600 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(139,92,246,0.32)] transition-all w-full min-w-0 sm:w-auto sm:min-w-[190px] inline-flex items-center justify-center ${
                    submitting ? "opacity-70 cursor-wait" : "hover:scale-[1.02]"
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
