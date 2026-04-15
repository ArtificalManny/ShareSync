// src/pages/PrivacyManifesto.jsx - Week 7 Privacy Foundation
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Lock, Eye, Database, Users, CheckCircle, 
  ArrowLeft, FileText, BarChart3, MessageCircle, Cloud,
  Zap, Heart, Target, X
} from 'lucide-react';
import { useIsMobile } from '../hooks/useMobile';
import useDocumentTitle from "../hooks/useDocumentTitle";

const PrivacyManifesto = () => {
  useDocumentTitle("Privacy");
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const principles = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'Your 1:1 and group chats are encrypted before leaving your device. Not even we can read them.',
      status: 'Active',
      color: 'emerald'
    },
    {
      icon: Cloud,
      title: 'Server-Side Encryption',
      description: 'Files in projects are encrypted on our servers using AES-256. Your data is protected at rest.',
      status: 'Active',
      color: 'blue'
    },
    {
      icon: BarChart3,
      title: 'Anonymous Analytics',
      description: 'Stats and streaks show anonymous counts only. We never sell or share individual user data.',
      status: 'Active',
      color: 'purple'
    },
    {
      icon: Eye,
      title: 'Zero-Knowledge Architecture',
      description: 'We designed OpenShare so we can\'t access your private content even if we wanted to.',
      status: 'Active',
      color: 'orange'
    },
    {
      icon: Database,
      title: 'Data Minimization',
      description: 'We only collect what\'s necessary for the app to work. No tracking pixels, no third-party analytics.',
      status: 'Active',
      color: 'cyan'
    },
    {
      icon: Users,
      title: 'You Own Your Data',
      description: 'Export all your data anytime. Delete your account and everything is permanently removed.',
      status: 'Active',
      color: 'fuchsia'
    }
  ];

  const comparisons = [
    {
      feature: 'Chat Encryption',
      shareSync: 'End-to-end',
      others: 'Server-side only',
      sharesynWins: true
    },
    {
      feature: 'Data Selling',
      shareSync: 'Never',
      others: 'To advertisers',
      sharesynWins: true
    },
    {
      feature: 'Analytics Tracking',
      shareSync: 'Anonymous only',
      others: 'Full user tracking',
      sharesynWins: true
    },
    {
      feature: 'Your Control',
      shareSync: '100%',
      others: 'Limited',
      sharesynWins: true
    }
  ];

  const getIconColorClass = (color) => {
    const colors = {
      emerald: 'text-emerald-400',
      blue: 'text-blue-400',
      purple: 'text-purple-400',
      orange: 'text-orange-400',
      cyan: 'text-cyan-400',
      fuchsia: 'text-fuchsia-400'
    };
    return colors[color] || 'text-slate-400';
  };

  const getBgColorClass = (color) => {
    const colors = {
      emerald: 'bg-emerald-500/20',
      blue: 'bg-blue-500/20',
      purple: 'bg-purple-500/20',
      orange: 'bg-orange-500/20',
      cyan: 'bg-cyan-500/20',
      fuchsia: 'bg-fuchsia-500/20'
    };
    return colors[color] || 'bg-slate-500/20';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617, #0f172a, #020617)' }} className="text-white pb-20">
      <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4' : 'px-6'} py-8`}>
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Settings</span>
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Privacy Manifesto
              </h1>
              <p className="text-slate-400 mt-1">How we protect your data</p>
            </div>
          </div>
        </div>

        {/* Our Promise */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <Heart className="w-8 h-8 text-emerald-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Our Promise to You</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                OpenShare is built on trust. We believe your data belongs to you, not to us or advertisers.
                We've designed every system with privacy-first principles.
              </p>
              <p className="text-slate-300 leading-relaxed">
                We will <strong className="text-white">never sell your data</strong>, 
                we will <strong className="text-white">never track you across the web</strong>, 
                and we will <strong className="text-white">always be transparent</strong> about how your information is used.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Principles */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Target className="w-6 h-6 text-purple-400" />
            Our Privacy Principles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {principles.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <div
                  key={index}
                  className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 ${getBgColorClass(principle.color)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${getIconColorClass(principle.color)}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white">{principle.title}</h3>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full">
                        {principle.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            How We Compare
          </h2>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-900/50 border-b border-slate-700/50">
              <div className="p-4 font-bold text-white">Feature</div>
              <div className="p-4 font-bold text-purple-400 border-l border-slate-700/50">OpenShare</div>
              <div className="p-4 font-bold text-slate-400 border-l border-slate-700/50">Others</div>
            </div>

            {comparisons.map((row, index) => (
              <div key={index} className="grid grid-cols-3 border-b border-slate-700/50 last:border-b-0">
                <div className="p-4 text-white">{row.feature}</div>
                <div className="p-4 border-l border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold">{row.shareSync}</span>
                  </div>
                </div>
                <div className="p-4 border-l border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-400" />
                    <span className="text-slate-400">{row.others}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Technical Details</h2>
          
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  Chat Encryption (E2EE)
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  We use the Signal Protocol for end-to-end encryption in all 1:1 and group chats. 
                  Messages are encrypted on your device before being sent, and only the recipient can decrypt them.
                  Not even OpenShare servers can read your messages.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  File Encryption (AES-256)
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Files uploaded to projects are encrypted at rest using AES-256, the same encryption standard
                  used by banks and governments. Your files are stored securely on our servers and only
                  accessible by authorized project members.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Anonymous Analytics
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  We collect anonymous aggregate statistics to improve OpenShare (e.g., "100 ships today across all users").
                  We never track individual user behavior, use cookies for advertising, or sell data to third parties.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Rights */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your Rights</h2>
          
          <div className="bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border border-purple-500/30 rounded-2xl p-6">
            <ul className="space-y-3">
              {[
                'Export all your data anytime in standard formats',
                'Delete your account and all data permanently',
                'Control who sees your profile and activity',
                'Opt out of any non-essential data collection',
                'Request a copy of all data we have about you',
                'Contact us with any privacy concerns'
              ].map((right, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">{right}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-3">Questions About Privacy?</h3>
          <p className="text-slate-400 mb-4">
            We're always happy to explain how we protect your data.
          </p>
          <button
            onClick={() => window.location.href = 'mailto:privacy@sharesync.com'}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-xl font-semibold transition-all"
          >
            Contact Privacy Team
          </button>
        </div>

        {/* Back to Settings */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/settings')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Settings
          </button>
        </div>

      </div>
    </div>
  );
};

export default PrivacyManifesto;
