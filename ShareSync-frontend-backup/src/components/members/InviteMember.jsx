// src/components/members/InviteMember.jsx - Invite new members (Google Drive style)
// invite-member-mobile-sheet-v2
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, UserPlus, Copy, Check, Mail } from 'lucide-react';
import { toast } from '../ui/toast';
import { enablePublic, disablePublic, regeneratePublicToken } from '../../api/public';

/**
 * InviteMember - Invite new members to project
 * Google Drive-style invite with email/link sharing
 */
const InviteMember = ({ projectId, projectName, onInvite, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [spectatorToken, setSpectatorToken] = useState('');
  const [copiedSpectatorLink, setCopiedSpectatorLink] = useState(false);
  const [spectatorLoading, setSpectatorLoading] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    const previousOverscroll =
      document.body.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.body.style.overscrollBehavior =
        previousOverscroll;

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [onClose]);

  const inviteLink = `${window.location.origin}/invite/${projectId}`;
  const spectatorLink = projectId
    ? `${window.location.origin}/projects/${encodeURIComponent(projectId)}`
    : '';

  // invite-explicit-ready-state-v2
  // One source of truth for both functional and visual button state.
  const inviteReady =
    Boolean(email.trim()) &&
    !inviting;

  const handleInvite = async () => {
    if (!email.trim()) {
      toast({ title: 'Enter an email address', variant: 'error' });
      return;
    }

    // Basic email validation
    if (!email.includes('@')) {
      toast({ title: 'Invalid email address', variant: 'error' });
      return;
    }

    setInviting(true);
    try {
      await onInvite?.({ email, role });
      toast({ 
        title: '📧 Invitation sent!', 
        description: `${email} will receive an email invite`,
        variant: 'success' 
      });
      setEmail('');
    } catch (error) {
      toast({ title: 'Failed to send invitation', variant: 'error' });
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    toast({
      title: '�� Link copied!',
      description: 'Share this link with anyone',
      variant: 'success'
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleGenerateSpectatorLink = async () => {
    if (!projectId || spectatorLoading) return;

    setSpectatorLoading(true);
    try {
      const result = await enablePublic(projectId);
      const token =
        result?.token ||
        result?.publicToken ||
        result?.data?.token ||
        result?.data?.publicToken ||
        '';

      if (!token) {
        throw new Error('No spectator token returned');
      }

      setSpectatorToken(token);
      toast({
        title: 'Spectator link ready',
        description: `${window.location.origin}/projects/${encodeURIComponent(projectId)}`,
        variant: 'success'
      });
    } catch (error) {
      toast({ title: error?.message || 'Failed to create spectator link', variant: 'error' });
    } finally {
      setSpectatorLoading(false);
    }
  };

  const handleRegenerateSpectatorLink = async () => {
    if (!projectId || spectatorLoading) return;

    setSpectatorLoading(true);
    try {
      const result = await regeneratePublicToken(projectId);
      const token =
        result?.token ||
        result?.publicToken ||
        result?.data?.token ||
        result?.data?.publicToken ||
        '';

      if (!token) {
        throw new Error('No spectator token returned');
      }

      setSpectatorToken(token);
      setCopiedSpectatorLink(false);
      toast({
        title: 'Spectator link regenerated',
        description: `${window.location.origin}/projects/${encodeURIComponent(projectId)}`,
        variant: 'success'
      });
    } catch (error) {
      toast({ title: error?.message || 'Failed to regenerate spectator link', variant: 'error' });
    } finally {
      setSpectatorLoading(false);
    }
  };

  const handleDisableSpectatorLink = async () => {
    if (!projectId || spectatorLoading) return;

    setSpectatorLoading(true);
    try {
      await disablePublic(projectId);
      setSpectatorToken('');
      setCopiedSpectatorLink(false);
      toast({ title: 'Spectator link disabled', variant: 'warning' });
    } catch (error) {
      toast({ title: 'Failed to disable spectator link', variant: 'error' });
    } finally {
      setSpectatorLoading(false);
    }
  };

  const handleCopySpectatorLink = () => {
    if (!spectatorLink) return;

    navigator.clipboard.writeText(spectatorLink);
    setCopiedSpectatorLink(true);
    toast({
      title: 'Spectator link copied',
      description: 'This link is read-only and does not grant membership.',
      variant: 'success'
    });
    setTimeout(() => setCopiedSpectatorLink(false), 2000);
  };

  // invite-member-mobile-sheet-v3
  const modal = (
    <div
      className="fixed inset-0 z-[10050] bg-black/70 backdrop-blur-sm"
      data-invite-member-overlay="true"
    >
      <style>{`
        [data-invite-member-modal="true"] {
          color-scheme: dark !important;
          background: #020617 !important;
          color: #f8fafc !important;
        }

        [data-invite-member-modal="true"] * {
          box-sizing: border-box;
        }

        [data-invite-member-modal="true"] .invite-sheet-header {
          background: rgba(2, 6, 23, 0.98) !important;
          color: #f8fafc !important;
        }

        [data-invite-member-modal="true"] .invite-sheet-body {
          background: #020617 !important;
          color: #f8fafc !important;
        }

        [data-invite-member-modal="true"] .invite-section {
          background: transparent !important;
          color: inherit !important;
        }

        [data-invite-member-modal="true"] .invite-modal-title {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          opacity: 1 !important;
        }

        [data-invite-member-modal="true"] .invite-project-name {
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
        }

        [data-invite-member-modal="true"] .invite-label {
          color: #f8fafc !important;
          -webkit-text-fill-color: #f8fafc !important;
        }

        [data-invite-member-modal="true"] .invite-helper {
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
        }

        [data-invite-member-modal="true"] .invite-badge {
          color: #a5f3fc !important;
          -webkit-text-fill-color: #a5f3fc !important;
          background: rgba(34, 211, 238, 0.10) !important;
        }

        [data-invite-member-modal="true"] input {
          width: 100% !important;
          min-width: 0 !important;
          min-height: 48px !important;
          border: 1px solid #334155 !important;
          border-radius: 0.9rem !important;
          background: #1e293b !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          opacity: 1 !important;
          box-shadow: none !important;
          -webkit-appearance: none !important;
          appearance: none !important;
        }

        [data-invite-member-modal="true"] input::placeholder {
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
          opacity: 1 !important;
        }

        [data-invite-member-modal="true"] .invite-primary-button {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          background:
            linear-gradient(
              135deg,
              #7c3aed 0%,
              #a855f7 52%,
              #d946ef 100%
            ) !important;
          opacity: 1 !important;
        }

        /* invite-button-visual-state-v2 */
        [data-invite-member-modal="true"]
        .invite-primary-button[data-invite-ready="true"] {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          opacity: 1 !important;
          cursor: pointer !important;
          border: 1px solid rgba(216, 180, 254, 0.50) !important;
          box-shadow:
            0 10px 26px rgba(124, 58, 237, 0.30),
            inset 0 1px 0 rgba(255, 255, 255, 0.16) !important;
        }

        [data-invite-member-modal="true"]
        .invite-primary-button[data-invite-ready="true"] svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        [data-invite-member-modal="true"]
        .invite-primary-button[data-invite-ready="false"] {
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
          background: #1e293b !important;
          border: 1px solid #334155 !important;
          opacity: 1 !important;
          cursor: not-allowed !important;
          box-shadow: none !important;
        }

        [data-invite-member-modal="true"]
        .invite-primary-button[data-invite-ready="false"] svg {
          color: #64748b !important;
          stroke: #64748b !important;
        }

        [data-invite-member-modal="true"] .invite-role-active {
          color: #e9d5ff !important;
          -webkit-text-fill-color: #e9d5ff !important;
          background: rgba(126, 34, 206, 0.38) !important;
          border-color: rgba(192, 132, 252, 0.50) !important;
        }

        [data-invite-member-modal="true"] .invite-role-inactive {
          color: #cbd5e1 !important;
          -webkit-text-fill-color: #cbd5e1 !important;
          background: #1e293b !important;
          border-color: #334155 !important;
        }

        [data-invite-member-modal="true"] .invite-link-value {
          color: #cbd5e1 !important;
          -webkit-text-fill-color: #cbd5e1 !important;
          background: #1e293b !important;
          border-color: #334155 !important;
        }

        [data-invite-member-modal="true"] .invite-secondary-button {
          color: #f8fafc !important;
          -webkit-text-fill-color: #f8fafc !important;
          background: #334155 !important;
          border-color: #475569 !important;
          opacity: 1 !important;
        }

        [data-invite-member-modal="true"] .invite-secondary-button:disabled {
          opacity: 0.45 !important;
        }

        [data-invite-member-modal="true"] .invite-divider-line {
          border-color: #334155 !important;
        }

        [data-invite-member-modal="true"] .invite-divider-label {
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
          background: #020617 !important;
        }

        [data-invite-member-modal="true"] .invite-regenerate {
          color: #7dd3fc !important;
          -webkit-text-fill-color: #7dd3fc !important;
        }

        [data-invite-member-modal="true"] .invite-disable {
          color: #fda4af !important;
          -webkit-text-fill-color: #fda4af !important;
        }

        [data-invite-member-modal="true"] .invite-info-card {
          color: #bae6fd !important;
          -webkit-text-fill-color: #bae6fd !important;
          background: rgba(14, 116, 144, 0.15) !important;
          border-color: rgba(56, 189, 248, 0.30) !important;
        }

        [data-invite-member-modal="true"] .invite-info-card * {
          color: inherit !important;
          -webkit-text-fill-color: inherit !important;
        }

        @media (max-width: 639px) {
          [data-invite-member-modal="true"] .invite-email-row,
          [data-invite-member-modal="true"] .invite-link-row {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 0.75rem !important;
          }

          [data-invite-member-modal="true"] .invite-action-button {
            width: 100% !important;
            min-height: 48px !important;
            justify-content: center !important;
          }
        }
      `}</style>

      <div
        className="flex h-[100dvh] w-full items-stretch justify-center overflow-hidden px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:items-center sm:p-4"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose?.();
          }
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-members-title"
          data-invite-member-modal="true"
          className="relative flex h-full min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-[1.5rem] border border-violet-500/35 shadow-2xl ring-1 ring-white/10 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-[1.75rem]"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />

          <header className="invite-sheet-header relative z-20 flex shrink-0 items-start justify-between border-b border-slate-800 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-white/15 sm:h-12 sm:w-12">
                <UserPlus className="h-6 w-6 text-white" />
              </div>

              <div className="min-w-0">
                <div className="invite-badge mb-1 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Share Access
                </div>

                <h2
                  id="invite-members-title"
                  className="invite-modal-title truncate text-2xl font-black leading-tight tracking-tight sm:text-3xl"
                >
                  Invite Members
                </h2>

                <p className="invite-project-name mt-0.5 truncate text-sm">
                  {projectName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Invite Members"
              className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div
            className="invite-sheet-body min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-10 sm:px-6 sm:py-6"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
            }}
          >
            <section className="invite-section mb-6">
              <label
                htmlFor="invite-member-email"
                className="invite-label mb-3 block text-sm font-bold"
              >
                Invite by Email
              </label>

              <div className="invite-email-row flex gap-3">
                <input
                  id="invite-member-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="email@example.com"
                  className="min-w-0 flex-1 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleInvite();
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={!inviteReady}
                  data-invite-ready={inviteReady ? 'true' : 'false'}
                  className="invite-primary-button invite-action-button flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold transition"
                >
                  {inviting ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Invite
                    </>
                  )}
                </button>
              </div>
            </section>

            <section className="invite-section mb-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('member')}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    role === 'member'
                      ? 'invite-role-active'
                      : 'invite-role-inactive'
                  }`}
                >
                  Member
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    role === 'admin'
                      ? 'invite-role-active'
                      : 'invite-role-inactive'
                  }`}
                >
                  Admin
                </button>
              </div>

              <p className="invite-helper mt-2 text-xs leading-5">
                {role === 'admin'
                  ? 'Admins can manage project settings'
                  : 'Members can view and contribute'}
              </p>
            </section>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="invite-divider-line w-full border-t" />
              </div>

              <div className="relative flex justify-center text-sm">
                <span className="invite-divider-label px-4">
                  Or share link
                </span>
              </div>
            </div>

            <section className="invite-section mb-6">
              <div className="invite-label mb-3 text-sm font-bold">
                Share Invite Link
              </div>

              <div className="invite-link-row flex gap-3">
                <div className="invite-link-value min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-xl border px-4 py-3 text-sm">
                  {inviteLink}
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="invite-secondary-button invite-action-button flex shrink-0 items-center justify-center gap-2 rounded-xl border px-6 py-3 font-semibold transition"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              <p className="invite-helper mt-2 text-xs leading-5">
                Anyone with this link can request to join
              </p>
            </section>

            <section className="invite-section mb-6">
              <div className="invite-label mb-3 text-sm font-bold">
                Share Spectator Link
              </div>

              <div className="invite-link-row flex gap-3">
                <div className="invite-link-value min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-xl border px-4 py-3 text-sm">
                  {spectatorLink ||
                    'Generate a read-only spectator link'}
                </div>

                <button
                  type="button"
                  onClick={
                    spectatorLink
                      ? handleCopySpectatorLink
                      : handleGenerateSpectatorLink
                  }
                  disabled={!projectId || spectatorLoading}
                  className="invite-secondary-button invite-action-button flex shrink-0 items-center justify-center gap-2 rounded-xl border px-6 py-3 font-semibold transition disabled:cursor-not-allowed"
                >
                  {copiedSpectatorLink ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      Copied!
                    </>
                  ) : spectatorLink ? (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  ) : spectatorLoading ? (
                    'Working...'
                  ) : (
                    'Generate'
                  )}
                </button>
              </div>

              <p className="invite-helper mt-2 text-xs leading-5">
                Anyone with this link can view a read-only
                project snapshot. They cannot join, edit, or
                see private project data.
              </p>

              {spectatorLink && (
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                  <button
                    type="button"
                    onClick={handleRegenerateSpectatorLink}
                    disabled={spectatorLoading}
                    className="invite-regenerate disabled:opacity-50"
                  >
                    Regenerate link
                  </button>

                  <button
                    type="button"
                    onClick={handleDisableSpectatorLink}
                    disabled={spectatorLoading}
                    className="invite-disable disabled:opacity-50"
                  >
                    Disable link
                  </button>
                </div>
              )}
            </section>

            <div className="invite-info-card rounded-2xl border p-4">
              <div className="flex gap-3">
                <Mail className="h-5 w-5 shrink-0 text-sky-400" />

                <div className="text-sm leading-6">
                  <p className="mb-1 font-bold">
                    Email invites are instant
                  </p>

                  <p className="opacity-80">
                    Recipients will get an email with a join
                    link and can access immediately after
                    accepting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modal;
  }

  return createPortal(modal, document.body);
};

export default InviteMember;
