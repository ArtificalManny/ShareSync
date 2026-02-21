// src/pages/admin/SafetyQueue.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SAFETY QUEUE — Content moderation dashboard
// Review user-reported content and take action
// 
// ATMOSPHERIC VERSION: Uses transparent backgrounds to let the body glow through
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  X,
  Ban,
  RefreshCw,
  ChevronDown,
  Clock,
  User,
  FileText,
  MessageSquare,
  Folder,
  Image,
  Filter,
} from 'lucide-react';
import api from '../../api/client';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const REASON_LABELS = {
  dangerous_content: { label: 'Dangerous Content', icon: '⚠️', color: 'text-red-400' },
  spam: { label: 'Spam', icon: '🚫', color: 'text-orange-400' },
  harassment: { label: 'Harassment', icon: '😠', color: 'text-amber-400' },
  hate_speech: { label: 'Hate Speech', icon: '🚷', color: 'text-red-500' },
  sexual_content: { label: 'Sexual Content', icon: '🔞', color: 'text-pink-400' },
  impersonation: { label: 'Impersonation', icon: '🎭', color: 'text-purple-400' },
  misinformation: { label: 'Misinformation', icon: '❌', color: 'text-yellow-400' },
  intellectual_property: { label: 'IP Violation', icon: '©️', color: 'text-blue-400' },
  other: { label: 'Other', icon: '📝', color: 'text-slate-400' },
};

const CONTENT_TYPE_ICONS = {
  user_profile: User,
  project: Folder,
  task: FileText,
  comment: MessageSquare,
  message: MessageSquare,
  file: Image,
};

const STATUS_COLORS = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  under_review: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Format time ago
// ═══════════════════════════════════════════════════════════════════════════════
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLURRED CONTENT VIEWER
// Images are blurred by default to protect admin mental health
// ═══════════════════════════════════════════════════════════════════════════════
function BlurredContent({ content, type }) {
  const [revealed, setRevealed] = useState(false);

  // Handle image content (avatars, uploaded images)
  if ((type === 'user_profile' && content?.avatar) || 
      (type === 'file' && content?.url)) {
    const imageUrl = content?.avatar || content?.url;
    
    return (
      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white/[0.05]">
        <img
          src={imageUrl}
          alt="Reported content"
          className={`w-full h-full object-cover transition-all duration-300 ${
            revealed ? '' : 'blur-xl scale-110'
          }`}
        />
        <button
          onClick={() => setRevealed(!revealed)}
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
        >
          {revealed ? (
            <EyeOff className="w-6 h-6 text-white" />
          ) : (
            <Eye className="w-6 h-6 text-white" />
          )}
        </button>
        {!revealed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-white/60">Click to reveal</span>
          </div>
        )}
      </div>
    );
  }

  // Handle text content
  const textContent = content?.content || 
                      content?.description || 
                      content?.bio || 
                      content?.text ||
                      content?.title ||
                      content?.name ||
                      'No content snapshot available';

  return (
    <div className="relative">
      <div
        className={`p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] transition-all duration-300 ${
          revealed ? '' : 'blur-sm select-none'
        }`}
      >
        <p className="text-sm text-slate-300 whitespace-pre-wrap">
          {textContent}
        </p>
      </div>
      {!revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg"
        >
          <span className="px-3 py-1.5 rounded-full bg-white/[0.1] backdrop-blur-sm text-xs text-slate-300 flex items-center gap-2">
            <Eye className="w-3 h-3" />
            Click to reveal content
          </span>
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT CARD (Glass Effect)
// ═══════════════════════════════════════════════════════════════════════════════
function ReportCard({ report, onResolve, isResolving }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState('');

  const reasonInfo = REASON_LABELS[report.reason] || REASON_LABELS.other;
  const ContentTypeIcon = CONTENT_TYPE_ICONS[report.contentType] || FileText;
  const statusColor = STATUS_COLORS[report.status] || STATUS_COLORS.pending;

  const handleAction = (action) => {
    onResolve(report._id, action, notes);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white/[0.03] backdrop-blur-sm rounded-xl border border-white/[0.06] overflow-hidden"
    >
      {/* Header - Always Visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Priority/Status Indicator */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              report.status === 'under_review'
                ? 'bg-orange-500/20'
                : report.priority >= 80
                ? 'bg-red-500/20'
                : 'bg-amber-500/20'
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${
                report.status === 'under_review'
                  ? 'text-orange-400'
                  : report.priority >= 80
                  ? 'text-red-400'
                  : 'text-amber-400'
              }`}
            />
          </div>

          {/* Content Info */}
          <div className="text-left">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Content Type */}
              <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                <ContentTypeIcon className="w-4 h-4 text-slate-400" />
                {report.contentType.replace('_', ' ')}
              </span>

              {/* Reason Badge */}
              <span
                className={`px-2 py-0.5 rounded text-xs bg-white/[0.05] ${reasonInfo.color}`}
              >
                {reasonInfo.icon} {reasonInfo.label}
              </span>

              {/* Status Badge */}
              <span
                className={`px-2 py-0.5 rounded text-xs border ${statusColor}`}
              >
                {report.status.replace('_', ' ')}
              </span>

              {/* Auto-hidden Badge */}
              {report.wasAutoHidden && (
                <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                  Auto-hidden
                </span>
              )}
            </div>

            {/* Meta Info */}
            <p className="text-xs text-slate-500 mt-1">
              Reported by{' '}
              <span className="text-slate-400">
                @{report.reporterId?.username || 'unknown'}
              </span>
              {' • '}
              <Clock className="w-3 h-3 inline" />{' '}
              {formatTimeAgo(report.createdAt)}
            </p>
          </div>
        </div>

        {/* Expand Arrow */}
        <ChevronDown
          className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/[0.06]"
          >
            <div className="p-4 space-y-4">
              {/* Reported User Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Reported User</p>
                  <p className="text-sm text-white">
                    {report.reportedUserId?.firstName}{' '}
                    {report.reportedUserId?.lastName}
                    <span className="text-slate-400 ml-1">
                      @{report.reportedUserId?.username || 'unknown'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Content Snapshot */}
              {report.contentSnapshot && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Reported Content
                  </p>
                  <BlurredContent
                    content={report.contentSnapshot}
                    type={report.contentType}
                  />
                </div>
              )}

              {/* Additional Context from Reporter */}
              {report.additionalContext && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    Reporter's Context
                  </p>
                  <p className="text-sm text-slate-400 italic bg-white/[0.02] p-3 rounded-lg border-l-2 border-slate-600">
                    "{report.additionalContext}"
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Review Notes (internal)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  rows={2}
                  className="
                    w-full px-3 py-2 rounded-lg resize-none
                    bg-white/[0.03] border border-white/[0.06]
                    text-sm text-white placeholder:text-slate-600
                    focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20
                    transition-all duration-200
                  "
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                {/* Dismiss (left) */}
                <button
                  onClick={() => handleAction('dismiss')}
                  disabled={isResolving}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                    text-sm text-slate-400 hover:text-white
                    hover:bg-white/[0.05] transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <X className="w-4 h-4" />
                  Dismiss
                </button>

                {/* Keep & Remove (right) */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction('keep')}
                    disabled={isResolving}
                    className="
                      flex items-center gap-1.5 px-4 py-1.5 rounded-lg
                      text-sm font-medium text-emerald-400
                      bg-emerald-500/10 hover:bg-emerald-500/20
                      border border-emerald-500/30
                      transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    <Check className="w-4 h-4" />
                    Keep Content
                  </button>
                  <button
                    onClick={() => handleAction('remove')}
                    disabled={isResolving}
                    className="
                      flex items-center gap-1.5 px-4 py-1.5 rounded-lg
                      text-sm font-medium text-red-400
                      bg-red-500/10 hover:bg-red-500/20
                      border border-red-500/30
                      transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    <Ban className="w-4 h-4" />
                    Remove Content
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS CARD (Glass Effect)
// ═══════════════════════════════════════════════════════════════════════════════
function StatsCard({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06]">
        <p className="text-2xl font-bold text-amber-400">{stats.pending || 0}</p>
        <p className="text-xs text-slate-500">Pending</p>
      </div>
      <div className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06]">
        <p className="text-2xl font-bold text-orange-400">{stats.underReview || 0}</p>
        <p className="text-xs text-slate-500">Under Review</p>
      </div>
      <div className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06]">
        <p className="text-2xl font-bold text-emerald-400">{stats.resolvedToday || 0}</p>
        <p className="text-xs text-slate-500">Resolved Today</p>
      </div>
      <div className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06]">
        <p className="text-2xl font-bold text-purple-400">
          {(stats.pending || 0) + (stats.underReview || 0)}
        </p>
        <p className="text-xs text-slate-500">Total Queue</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function SafetyQueue() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch reports
  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const [reportsRes, statsRes] = await Promise.all([
        api.get(`/content-reports/admin/queue?${params}`),
        api.get('/content-reports/admin/stats'),
      ]);

      const reportsData = reportsRes.data?.data ?? reportsRes.data;
      const statsData = statsRes.data?.data ?? statsRes.data;

      setReports(reportsData.reports || []);
      setTotalPages(reportsData.pages || 1);
      setTotal(reportsData.total || 0);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchReports();
  }, [page, statusFilter]);

  // Resolve report
  const handleResolve = async (reportId, action, notes) => {
    setIsResolving(true);

    try {
      await api.patch(`/content-reports/admin/${reportId}/resolve`, {
        action,
        notes,
      });

      // Remove from list
      setReports((prev) => prev.filter((r) => r._id !== reportId));
      setTotal((prev) => prev - 1);

      // Refresh stats
      const statsRes = await api.get('/content-reports/admin/stats');
      setStats(statsRes.data?.data ?? statsRes.data);
    } catch (err) {
      console.error('Failed to resolve report:', err);
      alert(err.response?.data?.message || 'Failed to resolve report');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    // ATMOSPHERIC: Transparent background lets body glow shine through
    <div className="min-h-screen p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Safety Queue</h1>
              <p className="text-sm text-slate-500">
                {total} report{total !== 1 ? 's' : ''} pending review
              </p>
            </div>
          </div>

          <button
            onClick={fetchReports}
            disabled={isLoading}
            className="
              p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]
              text-slate-400 hover:text-white hover:bg-white/[0.05]
              transition-colors disabled:opacity-50
            "
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <StatsCard stats={stats} />

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-slate-500" />
          {['all', 'pending', 'under_review'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`
                px-3 py-1.5 rounded-lg text-sm capitalize transition-colors
                ${
                  statusFilter === status
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                }
              `}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={fetchReports}
              className="mt-2 text-xs text-red-300 hover:text-red-200"
            >
              Try again
            </button>
          </div>
        )}

        {/* Reports List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              // Skeleton loaders (glass effect)
              [...Array(3)].map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-20 rounded-xl bg-white/[0.03] backdrop-blur-sm animate-pulse"
                />
              ))
            ) : reports.length === 0 ? (
              // Empty state
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-white font-medium">All clear!</p>
                <p className="text-sm text-slate-500 mt-1">
                  No reports pending review
                </p>
              </motion.div>
            ) : (
              // Report cards
              reports.map((report) => (
                <ReportCard
                  key={report._id}
                  report={report}
                  onResolve={handleResolve}
                  isResolving={isResolving}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="
                px-3 py-1.5 rounded-lg text-sm
                text-slate-400 hover:text-white hover:bg-white/[0.05]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="
                px-3 py-1.5 rounded-lg text-sm
                text-slate-400 hover:text-white hover:bg-white/[0.05]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              Next
            </button>
          </div>
        )}

        {/* Mental Health Notice */}
        <div className="mt-12 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center">
          <p className="text-sm text-purple-300">
            💜 Content moderation can be difficult. Take breaks when needed.
          </p>
          <p className="text-xs text-purple-400/60 mt-1">
            If you encounter particularly distressing content, please reach out to your team lead.
          </p>
        </div>
      </div>
    </div>
  );
}
