// src/pages/PrivacyManifesto.jsx - Week 7 Privacy Foundation
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, Lock, Eye, Database, Users, CheckCircle,
  ArrowLeft, FileText, BarChart3, MessageCircle, Cloud,
  Heart, Target
} from 'lucide-react';
import { useIsMobile } from '../hooks/useMobile';
import useDocumentTitle from "../hooks/useDocumentTitle";

const PrivacyManifesto = () => {
  useDocumentTitle("Privacy", {
    description:
      "Read OpenShare's privacy principles and how OpenShare handles personal information, visibility, and user control.",
    canonical: "https://openshare.ca/privacy-manifesto",
    robots: "index,follow",
  });
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const principles = [
    {
      icon: Lock,
      title: 'Access and permissions',
      description: 'OpenShare uses account sign-in and project permissions to help people control access to their work. Sharing choices and visibility depend on the feature.',
      status: 'Principle',
      color: 'emerald'
    },
    {
      icon: Cloud,
      title: 'Hosted services',
      description: 'OpenShare relies on infrastructure and email providers to operate the service. We explain their roles and relevant data handling in our Privacy Policy.',
      status: 'Principle',
      color: 'blue'
    },
    {
      icon: BarChart3,
      title: 'Clear activity disclosures',
      description: 'Project activity and account data support OpenShare features. Technical logs and any enabled analytics are described in our Privacy Policy.',
      status: 'Principle',
      color: 'purple'
    },
    {
      icon: Eye,
      title: 'Meaningful visibility choices',
      description: 'Some OpenShare features are public by design, while others rely on workspace access controls. Review your project and profile settings before sharing.',
      status: 'Principle',
      color: 'orange'
    },
    {
      icon: Database,
      title: 'Data minimization',
      description: 'Our goal is to process only the information needed to operate, secure, and improve OpenShare, with disclosures that reflect actual service behavior.',
      status: 'Principle',
      color: 'cyan'
    },
    {
      icon: Users,
      title: 'Account and data controls',
      description: 'Users can export available account information and request account deletion. Certain shared contributions may remain for collaborators as explained in our policy.',
      status: 'Principle',
      color: 'fuchsia'
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
              <h2 className="text-2xl font-bold text-white mb-3">Our Approach to Privacy</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                OpenShare aims to give people meaningful control over their work and personal information.
                Our privacy commitments should be clear, practical, and consistent with how the service actually operates.
              </p>
              <p className="text-slate-300 leading-relaxed">
                This manifesto explains our guiding principles, not a guarantee of a particular encryption method.
                For specific collection, sharing, retention, and deletion practices, read our{' '}
                <Link to="/privacy" className="text-purple-300 underline hover:text-purple-200">Privacy Policy</Link>.
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

                      </div>
                      <span className="text-xs px-2 py-1 bg-slate-700/60 text-slate-300 rounded-full">
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

        {/* Privacy commitments in practice */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <FileText className="w-6 h-6 text-purple-400" />
            Privacy in Practice
          </h2>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-slate-300 leading-7 space-y-4">
            <p>OpenShare processes account information, project content, and operational records to provide and protect the service. Some projects, profiles, and collaborative activity may be public when shared.</p>
            <p>OpenShare has an account-deletion workflow designed to remove the account and associated records. Some authored messages and shared-project contributions may remain to preserve collaborative history; details and deletion requests are explained in the pages below.</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/privacy" className="font-semibold text-purple-300 underline hover:text-purple-200">Read the Privacy Policy</Link>
              <Link to="/delete-account" className="font-semibold text-purple-300 underline hover:text-purple-200">Account deletion information</Link>
            </div>
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
                  Messaging and Access
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  OpenShare uses authentication and access controls for messaging and collaboration.
                  The specific encryption protections available depend on the implementation and should not be assumed to provide end-to-end encryption.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Project Files and Storage
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Project files are handled by OpenShare and its storage infrastructure, subject to access and sharing controls.
                  Our formal Privacy Policy provides current information about data handling; individual encryption mechanisms should only be represented after verification.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Usage Data and Diagnostics
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  OpenShare processes user-linked application events and technical logs for functionality, troubleshooting, and security.
                  The frontend also has an optional analytics integration. The current Privacy Policy explains production settings and disclosures.
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
                'Request an export of available account information',
                'Request account deletion, with shared-history exceptions explained in our policy',
                'Control who sees your profile and activity',
                'Review the Privacy Policy for how data is processed',
                'Ask about available access, correction, or deletion options',
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
            onClick={() => { window.location.href = 'mailto:realMannyRivas@proton.me'; }}
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
