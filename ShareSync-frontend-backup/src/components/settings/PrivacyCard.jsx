import React from 'react';
import { Shield, Eye, Lock, Database, Check } from 'lucide-react';

export default function PrivacyCard() {
  const dataTypes = [
    { 
      name: 'Tasks & Ships', 
      purpose: 'Track your productivity patterns',
      stored: 'Encrypted on MongoDB Atlas',
      retention: 'Forever (unless you delete)'
    },
    { 
      name: 'Focus Sessions', 
      purpose: 'Analyze your concentration habits',
      stored: 'Encrypted on MongoDB Atlas',
      retention: '90 days'
    },
    { 
      name: 'Experiments', 
      purpose: 'Help you learn what works',
      stored: 'Encrypted on MongoDB Atlas',
      retention: 'Until experiment is deleted'
    },
    { 
      name: 'Collaboration Data', 
      purpose: 'Show team activity & co-working patterns',
      stored: 'Encrypted on MongoDB Atlas',
      retention: 'While you\'re a project member'
    },
  ];

  const commitments = [
    'We never sell your data',
    'We never show ads',
    'We encrypt data at rest and in transit',
    'You can export or delete everything anytime',
    'We only use data to make ShareSync better for you',
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold">Privacy Transparency</h3>
      </div>

      {/* Introduction */}
      <div className="mb-6">
        <p className="text-sm text-slate-300 mb-3">
          We believe you should know exactly what data we collect and why. 
          Here's everything, in plain English.
        </p>
      </div>

      {/* What We Collect */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          What We Collect
        </h4>
        <div className="space-y-3">
          {dataTypes.map((data, index) => (
            <div
              key={index}
              className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-white text-sm">{data.name}</h5>
                <Eye className="w-4 h-4 text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">
                  <span className="text-slate-500">Purpose:</span> {data.purpose}
                </p>
                <p className="text-xs text-slate-400">
                  <span className="text-slate-500">Stored:</span> {data.stored}
                </p>
                <p className="text-xs text-slate-400">
                  <span className="text-slate-500">Retention:</span> {data.retention}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Our Commitments */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          Our Commitments
        </h4>
        <div className="space-y-2">
          {commitments.map((commitment, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm text-slate-300"
            >
              <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>{commitment}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Your Rights */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-purple-300 mb-2">Your Rights</h4>
        <p className="text-xs text-slate-300 mb-3">
          You have complete control over your data. At any time, you can:
        </p>
        <div className="space-y-1 text-xs text-slate-400">
          <p>• Export all your data (Settings → Export Data)</p>
          <p>• Delete specific experiments or projects</p>
          <p>• Request complete account deletion</p>
          <p>• Ask us questions at privacy@sharesync.app</p>
        </div>
      </div>
    </div>
  );
}
