import React, { useState } from 'react';
import { Rocket, X, Bug, Star, DollarSign, Trophy } from 'lucide-react';
import { shipProject } from '../../api/projects';
import { toast } from '../ui/toast';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const QuickShipModal = ({ isOpen, onClose, projectId }) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [shipping, setShipping] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  const categories = [
    { id: 'bug', label: 'Bug Fix', icon: Bug, color: 'red' },
    { id: 'feature', label: 'Feature', icon: Star, color: 'blue' },
    { id: 'payment', label: 'Payment', icon: DollarSign, color: 'emerald' },
    { id: 'milestone', label: 'Milestone', icon: Trophy, color: 'yellow' },
  ];

  const suggestions = [
    'Fixed login bug',
    'Added dark mode',
    'Deployed to production',
    'Client payment received',
    'Completed milestone',
  ];

  const handleShip = async () => {
    if (!description.trim()) {
      toast({ title: 'Add a description', variant: 'error' });
      return;
    }

    try {
      setShipping(true);
      
      await shipProject(projectId, {
        description: description.trim(),
        category: category || undefined,
      });

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      toast({
        title: '🎉 Shipped!',
        description: '+50 XP earned',
        variant: 'success',
      });

      setDescription('');
      setCategory('');
      setTimeout(() => onClose(), 1500);
      
    } catch (error) {
      toast({ title: 'Failed to ship', variant: 'error' });
    } finally {
      setShipping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Quick Ship</h2>
                <p className="text-sm text-slate-400">Log a win in 5 seconds</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="text-sm text-slate-400 mb-2 block font-medium">
              What did you just ship?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., Fixed the login bug that was blocking users"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none"
              maxLength={200}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleShip();
                }
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">{description.length}/200</span>
              <span className="text-xs text-slate-500">Cmd/Ctrl + Enter to ship</span>
            </div>
          </div>

          {/* Quick Suggestions */}
          {description.length === 0 && (
            <div className="mb-6">
              <label className="text-xs text-slate-500 mb-2 block">Quick suggestions:</label>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDescription(suggestion)}
                    className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="mb-6">
            <label className="text-sm text-slate-400 mb-3 block font-medium">
              Category (optional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id === category ? '' : cat.id)}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                    category === cat.id
                      ? `bg-${cat.color}-500/20 border-${cat.color}-500 text-${cat.color}-400`
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-purple-500/50'
                  }`}
                >
                  <cat.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleShip}
              disabled={shipping || !description.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:shadow-lg rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {shipping ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Shipping...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Ship +50 XP 🎉
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default QuickShipModal;
