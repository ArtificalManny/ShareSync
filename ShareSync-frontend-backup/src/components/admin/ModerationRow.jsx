// src/components/admin/ModerationRow.jsx
import React, { useMemo, useState } from 'react';
import { Check, X, Eye, Lightbulb, ExternalLink } from 'lucide-react';

function getId(p) {
  return p?.id || p?._id || p?.projectId || '';
}

function pillClasses(kind) {
  switch (kind) {
    case 'pending':
      return 'bg-warning-500/10 text-warning-300 border border-warning-500/20';
    case 'approved':
      return 'bg-success-500/10 text-success-300 border border-success-500/20';
    case 'rejected':
      return 'bg-error-500/10 text-error-300 border border-error-500/20';
    default:
      return 'bg-surface-2 text-text-tertiary border border-white/[0.06]';
  }
}

export default function ModerationRow({
  project,
  busy = false,
  onApprove,
  onReject,
  onToggleSpectator,
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const id = useMemo(() => getId(project), [project]);
  const name = project?.name || project?.title || '(Untitled)';
  const description = project?.description || '';
  const status = (project?.moderationStatus || 'pending').toLowerCase();
  const spectatorMode = (project?.spectatorMode || 'view').toLowerCase();

  const isListed = !!project?.isListed;
  const visibility = (project?.visibility || '').toLowerCase();

  const canApprove = !busy;
  const canReject = !busy;

  const spectatorLabel =
    spectatorMode === 'suggest' ? 'Suggestions ON' : 'View-only';

  const SpectatorIcon = spectatorMode === 'suggest' ? Lightbulb : Eye;

  const handleApprove = () => onApprove?.(id, project);
  const handleReject = () => {
    const reason = (rejectReason || '').trim();
    onReject?.(id, project, reason);
    setRejectReason('');
    setShowReject(false);
  };

  const handleToggleSpectator = () => {
    const next = spectatorMode === 'suggest' ? 'view' : 'suggest';
    onToggleSpectator?.(id, project, next);
  };

  return (
    <div className="p-4 rounded-2xl bg-surface-1 border border-white/[0.06] hover:border-white/[0.12] transition-all">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm font-semibold text-text-primary truncate">
              {name}
            </div>

            <span className={`text-[10px] px-2 py-0.5 rounded-full ${pillClasses(status)}`}>
              {status.toUpperCase()}
            </span>

            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
              {visibility ? visibility.toUpperCase() : 'VISIBILITY?'}
            </span>

            {isListed && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                LISTED
              </span>
            )}
          </div>

          {description && (
            <div className="mt-1 text-xs text-text-tertiary line-clamp-2">
              {description}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={busy}
              onClick={handleToggleSpectator}
              className={`
                inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
                border border-white/[0.08] bg-surface-2 hover:bg-surface-3
                text-text-secondary transition-all
                ${busy ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              title="Toggle spectator mode"
            >
              <SpectatorIcon className="w-3.5 h-3.5" />
              {spectatorLabel}
            </button>

            <a
              href={`/projects/${id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
                         border border-white/[0.08] bg-surface-2 hover:bg-surface-3
                         text-text-secondary transition-all"
              title="Open project"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={!canApprove}
            onClick={handleApprove}
            className={`
              inline-flex items-center justify-center gap-2
              px-3 py-2 rounded-xl text-xs font-medium
              bg-success-500/15 text-success-200 border border-success-500/20
              hover:bg-success-500/20 transition-all
              ${!canApprove ? 'opacity-60 cursor-not-allowed' : ''}
            `}
            title="Approve listing"
          >
            <Check className="w-4 h-4" />
            Approve
          </button>

          <button
            type="button"
            disabled={!canReject}
            onClick={() => setShowReject((s) => !s)}
            className={`
              inline-flex items-center justify-center gap-2
              px-3 py-2 rounded-xl text-xs font-medium
              bg-error-500/12 text-error-200 border border-error-500/20
              hover:bg-error-500/18 transition-all
              ${!canReject ? 'opacity-60 cursor-not-allowed' : ''}
            `}
            title="Reject listing"
          >
            <X className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>

      {showReject && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <div className="text-xs text-text-secondary mb-2">
            Rejection reason (optional)
          </div>
          <div className="flex gap-2">
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Needs better description / not appropriate / spam"
              className="flex-1 bg-surface-0 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              disabled={busy}
            />
            <button
              type="button"
              disabled={busy}
              onClick={handleReject}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium
                bg-brand-600 text-white hover:bg-brand-500 transition-all
                ${busy ? 'opacity-60 cursor-not-allowed' : ''}
              `}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
