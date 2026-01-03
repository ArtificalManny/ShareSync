import React, { useState, useEffect } from 'react';
import { Rocket, Sparkles, Bug, Star, DollarSign, Trophy, X } from 'lucide-react';
import BottomSheet from '../mobile/BottomSheet';
import { shipProject } from '../../api/projects';
import { toast } from '../ui/toast';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const QuickShipSheet = ({ isOpen, onClose, projectId }) => {
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
      
      const shipData = {
        description: description.trim(),
        category: category || undefined,
      };

      await shipProject(projectId, shipData);

      // Show confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      // Success feedback
      toast({
        title: '🎉 Shipped!',
        description: '+50 XP earned',
        variant: 'success',
      });

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 100, 50]);
      }

      // Reset and close
      setDescription('');
      setCategory('');
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      toast({ title: 'Failed to ship', variant: 'error' });
    } finally {
      setShipping(false);
    }
  };

  const handleSuggestion = (suggestion) => {
    setDescription(suggestion);
  };

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

      <BottomSheet isOpen={isOpen} onClose={onClose} title="Quick Ship">
        <div className="p-6 space-y-6">
          {/* Description Input */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block font-medium">
              What did you just ship?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., Fixed the login bug that was blocking users"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-base focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none"
              maxLength={200}
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">
                {description.length}/200
              </span>
            </div>
          </div>

          {/* Quick Suggestions */}
          {description.length === 0 && (
            <div>
              <label className="text-xs text-slate-500 mb-2 block">
                Quick suggestions:
              </label>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestion(suggestion)}
                    className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-all active:scale-95"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label className="text-sm text-slate-400 mb-3 block font-medium">
              Category (optional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id === category ? '' : cat.id)}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    category === cat.id
                      ? `bg-${cat.color}-500/20 border-${cat.color}-500 text-${cat.color}-400`
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 active:scale-95'
                  }`}
                >
                  <cat.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleShip}
              disabled={shipping || !description.trim()}
              className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {shipping ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Shipping...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Ship +50 XP
                </>
              )}
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};

export default QuickShipSheet;
