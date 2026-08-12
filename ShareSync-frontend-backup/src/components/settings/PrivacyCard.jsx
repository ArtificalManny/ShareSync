// src/components/settings/PrivacyCard.jsx - Week 7 Privacy Foundation
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  FileText,
  BarChart3,
  ChevronRight,
  CheckCircle,
  Download,
  LoaderCircle,
} from 'lucide-react';
import api from '../../api/client';

const PrivacyCard = () => {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [exportFailed, setExportFailed] = useState(false);

  const handleDownloadData = async () => {
    if (exporting) return;

    setExporting(true);
    setExportMessage('');
    setExportFailed(false);

    try {
      const response = await api.get('/users/me/export');
      const payload = response?.data?.data ?? response?.data;

      if (!payload || typeof payload !== 'object') {
        throw new Error('OpenShare returned an invalid data export.');
      }

      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], {
        type: 'application/json;charset=utf-8',
      });
      const objectUrl = URL.createObjectURL(blob);

      const date = new Date().toISOString().slice(0, 10);
      const filename = `openshare-data-${date}.json`;

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.style.display = 'none';

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);

      setExportMessage(`Downloaded ${filename}`);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Could not download your OpenShare data. Please try again.';

      setExportFailed(true);
      setExportMessage(String(message));
    } finally {
      setExporting(false);
    }
  };

  const privacyFeatures = [
    {
      icon: Lock,
      title: 'Messages and conversations',
      description: 'Encrypted in transit',
      status: 'active',
      color: 'emerald'
    },
    {
      icon: FileText,
      title: 'Project files',
      description: 'Stored securely',
      status: 'active',
      color: 'blue'
    },
    {
      icon: BarChart3,
      title: 'Stats and streaks',
      description: 'Private activity counts',
      status: 'active',
      color: 'purple'
    }
  ];

  const getIconColorClass = (color) => {
    const colors = {
      emerald: 'text-emerald-400',
      blue: 'text-blue-400',
      purple: 'text-purple-400',
      orange: 'text-orange-400'
    };
    return colors[color] || 'text-slate-400';
  };

  const getBgColorClass = (color) => {
    const colors = {
      emerald: 'bg-emerald-500/20',
      blue: 'bg-blue-500/20',
      purple: 'bg-purple-500/20',
      orange: 'bg-orange-500/20'
    };
    return colors[color] || 'bg-slate-500/20';
  };

  return (
    <div className="bg-white dark:bg-[#1f1f23] rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Privacy & Encryption</h2>
      </div>

      <div className="space-y-4 mb-6">
        {privacyFeatures.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 ${getBgColorClass(feature.color)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${getIconColorClass(feature.color)}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                    {feature.status === 'active' && (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Privacy Controls Badge */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-emerald-300 mb-1">Privacy Controls</div>
            <div className="text-xs text-slate-400">Review your settings</div>
          </div>
          <div className="text-3xl font-bold text-emerald-400">Available</div>
        </div>
      </div>

      {/* Account data export */}
      <div
        className="mb-6 rounded-xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-500/20 dark:bg-violet-500/[0.07]"
        data-openshare-data-export="v1"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/15">
            <Download className="h-5 w-5 text-violet-600 dark:text-violet-300" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Your OpenShare data
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              Download a JSON copy of your account, project, and activity data.
            </p>

            <button
              type="button"
              onClick={handleDownloadData}
              disabled={exporting}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-500 dark:hover:bg-violet-400"
              data-openshare-download-data="v1"
            >
              {exporting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Preparing download...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download my data
                </>
              )}
            </button>

            {exportMessage ? (
              <p
                className={`mt-3 text-xs font-medium ${
                  exportFailed
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
                role={exportFailed ? 'alert' : 'status'}
                aria-live="polite"
              >
                {exportMessage}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Learn More Button */}
      <button
        type="button"
        onClick={() => navigate('/privacy-manifesto')}
        className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-slate-900 dark:text-white px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
      >
        <span>Learn More About Our Privacy</span>
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5 p-3">
          <div className="text-xs text-slate-500 mb-1">Privacy defaults</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">✓</div>
        </div>
        <div className="bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5 p-3">
          <div className="text-xs text-slate-500 mb-1">Data sold</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">Never</div>
        </div>
        <div className="bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5 p-3">
          <div className="text-xs text-slate-500 mb-1">User controls</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">Available</div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyCard;
