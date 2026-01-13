import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/onboarding.css";

// Optional helpers/components if present in your codebase
// (we guard usage so the modal still works without them)
let AvatarUploader = null;
try {
  // eslint-disable-next-line import/no-unresolved
  AvatarUploader = require("../components/profile/AvatarUploader").default;
} catch {}

function useThemeSetter() {
  // Prefer your hook if it exists
  try {
    // eslint-disable-next-line import/no-unresolved
    const { default: useBrandTheme } = require("../hooks/useBrandTheme.js");
    const { setTheme } = useBrandTheme();
    return (t) => setTheme?.(t);
  } catch {
    return (t) => {
      const el = document.documentElement;
      if (t) el.setAttribute("data-theme", t);
      else el.removeAttribute("data-theme");
    };
  }
}

async function createProjectAPI(payload) {
  // Try your projects API first, fall back to fetch.
  try {
    const mod = await import("../api/projects");
    if (typeof mod.createProject === "function") {
      return await mod.createProject(payload);
    }
  } catch {}
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Create project failed (${res.status})`);
  return res.json();
}

function Step({ title, subtitle, children }) {
  return (
    <div className="onb-step">
      <h2 className="onb-title">{title}</h2>
      {subtitle ? <p className="onb-subtitle">{subtitle}</p> : null}
      <div className="onb-body">{children}</div>
    </div>
  );
}

export default function FirstRunModal({
  open,
  onClose,
  onFinished, // (projectId?: string) => void
}) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState("");

  // Project
  const [projectName, setProjectName] = useState("");
  const [project, setProject] = useState(null);

  // Invites
  const [emails, setEmails] = useState("");

  // Theme
  const [themeChoice, setThemeChoice] = useState("default");
  const setTheme = useThemeSetter();

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSaving(false);
    setError("");
  }, [open]);

  const close = () => {
    onClose?.();
  };

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleUploadAvatar = async (file) => {
    // If AvatarUploader exists, it will call back here with the raw file.
    // The uploader component (if present) will handle server upload itself.
    // We maintain a preview to give instant feedback.
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError("Please enter a project name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await createProjectAPI({ name: projectName.trim() });
      setProject(created);
      next();
    } catch (e) {
      setError(e?.message || "Failed to create your first project.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvites = async () => {
    // Soft/optional – send to backend if available; otherwise just continue.
    const list =
      emails
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean) || [];
    if (!list.length) {
      next();
      return;
    }

    setSaving(true);
    setError("");
    try {
      // Prefer your invite API if present
      try {
        const { inviteMembers } = require("../api/invite");
        if (typeof inviteMembers === "function" && project?._id) {
          await inviteMembers(project._id, list);
        } else {
          throw new Error("inviteMembers not available");
        }
      } catch {
        // Fallback
        if (!project?._id && !project?.id) throw new Error("Project missing");
        await fetch(`/api/projects/${project._id || project.id}/invite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: list }),
        });
      }
      next();
    } catch (e) {
      setError(e?.message || "Failed to send invites.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    localStorage.setItem("ss.onboarded", "1");
    try {
      setTheme(themeChoice === "proton" ? "proton" : null);
    } catch {}
    onFinished?.(project?._id || project?.id);
    close();
  };

  if (!open) return null;

  return (
    <>
      <div className="onb-backdrop" onClick={close} aria-hidden="true" />
      <div
        className="onb-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to OpenShare"
      >
        <div className="onb-header">
          <div className="onb-badge">Welcome ✨</div>
          <button className="onb-close" onClick={close} aria-label="Close onboarding">
            ×
          </button>
        </div>

        {step === 0 && (
          <Step
            title="Let’s get you set up"
            subtitle="Two minutes to a great first day. We’ll guide you through the essentials."
          >
            <ul className="onb-list">
              <li>• Add your avatar</li>
              <li>• Create your first project</li>
              <li>• Invite a teammate</li>
              <li>• Pick a theme</li>
            </ul>
            <div className="onb-actions">
              <button className="btn btn--outline" onClick={close}>Skip</button>
              <button className="btn btn--primary" onClick={next}>Start</button>
            </div>
          </Step>
        )}

        {step === 1 && (
          <Step
            title="Add your avatar"
            subtitle="A face to the name helps collaboration feel human."
          >
            {AvatarUploader ? (
              <AvatarUploader onUploaded={handleUploadAvatar} />
            ) : (
              <div className="onb-upload-fallback">
                <label className="onb-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadAvatar(e.target.files?.[0] || null)}
                  />
                  <span>Upload image</span>
                </label>
              </div>
            )}
            {avatarPreview && (
              <div className="onb-avatar-preview">
                <img src={avatarPreview} alt="Avatar preview" />
              </div>
            )}
            <div className="onb-actions">
              <button className="btn btn--ghost" onClick={back}>Back</button>
              <button className="btn btn--primary" onClick={next}>Continue</button>
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step
            title="Create your first project"
            subtitle="Start with one clear outcome. You can add more later."
          >
            <label className="onb-field">
              <span>Project name</span>
              <input
                type="text"
                placeholder="e.g., Launch landing page"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </label>
            {error && <div className="onb-error">{error}</div>}
            <div className="onb-actions">
              <button className="btn btn--ghost" onClick={back}>Back</button>
              <button
                className="btn btn--primary"
                onClick={handleCreateProject}
                disabled={saving}
              >
                {saving ? "Creating…" : "Create project"}
              </button>
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step
            title="Invite a teammate"
            subtitle="Faster together. Add one or two collaborators now."
          >
            <label className="onb-field">
              <span>Emails (comma or space separated)</span>
              <input
                type="text"
                placeholder="teammate@work.com, partner@work.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
              />
            </label>
            {error && <div className="onb-error">{error}</div>}
            <div className="onb-actions">
              <button className="btn btn--ghost" onClick={back}>Back</button>
              <button
                className="btn btn--primary"
                onClick={handleSendInvites}
                disabled={saving}
              >
                {saving ? "Sending…" : "Send invites"}
              </button>
              <button className="btn btn--outline" onClick={next}>Do later</button>
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step
            title="Pick a theme"
            subtitle="You can change this anytime from Settings."
          >
            <div className="onb-themes">
              <label className={`onb-theme ${themeChoice === "default" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="theme"
                  value="default"
                  checked={themeChoice === "default"}
                  onChange={() => setThemeChoice("default")}
                />
                <span>Default</span>
              </label>
              <label className={`onb-theme ${themeChoice === "proton" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="theme"
                  value="proton"
                  checked={themeChoice === "proton"}
                  onChange={() => setThemeChoice("proton")}
                />
                <span>Proton</span>
              </label>
            </div>
            <div className="onb-actions">
              <button className="btn btn--ghost" onClick={back}>Back</button>
              <button className="btn btn--primary" onClick={handleFinish}>Finish</button>
            </div>
          </Step>
        )}
      </div>
    </>
  );
}
