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
    <Dialog open={true} onClose={submitting ? () => {} : onClose} className="fixed inset-0 z-[100]">
      <div className="pc-create-backdrop fixed inset-0 bg-black/5 backdrop-blur-[2px]" aria-hidden="true" />

      <div className="pc-create-viewport fixed inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <Dialog.Panel className="pc-create-modal pointer-events-auto relative w-full max-w-2xl max-h-[85dvh] flex flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white backdrop-blur-sm shadow-[0_24px_80px_rgba(139,92,246,0.16)]">
          <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50/70 rounded-t-[28px]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-[0_10px_28px_rgba(139,92,246,0.24)]">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-semibold text-slate-900">
                  Create New Project
                </Dialog.Title>
                <p className="text-sm text-slate-500">Start building your next big thing</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 hover:bg-slate-100 transition-colors group"
              aria-label="Close create project dialog"
              disabled={submitting}
            >
              <X className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </button>
          </div>

          <form
            id={formId}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            className="flex-1 overflow-y-auto px-6 py-6 bg-transparent"
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
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-violet-500" />
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.16em]">
                      {smartStartMode ? "Smart Start" : "Project Basics"}
                    </h3>
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
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-violet-500" />
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.16em]">
                    Privacy
                  </h3>
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
                <div className="flex items-center gap-2 mb-4">
                  <UsersIcon className="w-5 h-5 text-violet-500" />
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.16em]">
                    Team Members
                  </h3>
                  <span className="text-xs text-slate-500">(Optional)</span>
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

          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5 border-t border-slate-100 bg-white rounded-b-[28px]">
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

            <div className="flex w-full sm:w-auto flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 transition-all w-full sm:w-auto min-w-[132px]"
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
                  className={`rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(139,92,246,0.32)] transition-all w-full sm:w-auto min-w-[190px] inline-flex items-center justify-center ${
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
