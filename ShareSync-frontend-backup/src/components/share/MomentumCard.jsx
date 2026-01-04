// src/components/share/MomentumCard.jsx - Week 9 Day 3-4
import React, { useRef } from 'react';
import { Download, Copy, Check, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from '../ui/toast';

/**
 * MomentumCard - Shareable social media card
 * Shows streak, XP, achievements in a beautiful gradient card
 * Optimized for Twitter/LinkedIn sharing
 */
const MomentumCard = ({ user, onClose }) => {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const topAchievements = user.achievements?.slice(0, 3) || [];

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${user.username}-momentum-card.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ 
        title: '📸 Card downloaded!', 
        description: 'Share your momentum on social media',
        variant: 'success' 
      });
    } catch (error) {
      console.error('Failed to download card:', error);
      toast({ title: 'Download failed', variant: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });

      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          toast({ 
            title: '📋 Copied to clipboard!', 
            description: 'Paste into Twitter, LinkedIn, etc.',
            variant: 'success' 
          });
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          // Fallback: just download if clipboard API fails
          handleDownload();
        }
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-2xl w-full">
        
        {/* Close Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Card Preview */}
        <div 
          ref={cardRef}
          className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-12 shadow-2xl"
          style={{ width: '1200px', height: '630px', transform: 'scale(0.5)', transformOrigin: 'top center' }}
        >
          {/* ShareSync Branding */}
          <div className="mb-8">
            <div className="inline-block px-6 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                ShareSync
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-12">
            <div className="flex items-center gap-6 mb-4">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center text-5xl font-bold text-white">
                {user.avatar || user.name?.[0] || user.username?.[0] || '?'}
              </div>
              <div>
                <h1 className="text-6xl font-bold text-white mb-2">{user.name || user.username}</h1>
                <p className="text-3xl text-slate-300">@{user.username}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-8 mb-12">
            {/* Streak */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="text-5xl mb-3">🔥</div>
              <div className="text-7xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
                {user.streak || 0}
              </div>
              <div className="text-2xl text-slate-300">Day Streak</div>
            </div>

            {/* XP */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="text-5xl mb-3">⚡</div>
              <div className="text-7xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
                {user.totalXP?.toLocaleString() || 0}
              </div>
              <div className="text-2xl text-slate-300">Total XP</div>
            </div>

            {/* Achievements */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="text-5xl mb-3">🏆</div>
              <div className="text-7xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
                {user.achievements?.length || 0}
              </div>
              <div className="text-2xl text-slate-300">Achievements</div>
            </div>
          </div>

          {/* Top Achievements */}
          {topAchievements.length > 0 && (
            <div>
              <h3 className="text-3xl font-bold text-white mb-6">Recent Achievements</h3>
              <div className="flex gap-6">
                {topAchievements.map((achievement, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                  >
                    <div className="text-4xl mb-3">{achievement.icon}</div>
                    <div className="text-xl font-semibold text-white">{achievement.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="absolute bottom-12 right-12">
            <div className="text-2xl text-slate-400">
              sharesync.app/{user.username}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleCopyImage}
            disabled={downloading}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {copied ? (
              <>
                <Check className="w-6 h-6" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-6 h-6" />
                Copy Image
              </>
            )}
          </button>
          
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-xl font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <Download className="w-6 h-6" />
            {downloading ? 'Generating...' : 'Download'}
          </button>
        </div>

        <p className="text-center text-slate-400 text-sm mt-4">
          Perfect for Twitter, LinkedIn, Instagram stories
        </p>
      </div>
    </div>
  );
};

export default MomentumCard;
