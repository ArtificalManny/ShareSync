// src/components/suggestions/SuggestionsPanel.jsx - Panel showing all suggestions
import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, TrendingUp, Clock, Filter } from 'lucide-react';
import SuggestionCard from './SuggestionCard';
import SuggestionForm from './SuggestionForm';

/**
 * SuggestionsPanel - Display and manage project suggestions
 * Shows all public suggestions, sorted by votes
 */
const SuggestionsPanel = ({ projectId, isProjectMember = false, isPublicProject = false }) => {
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState('votes'); // 'votes' or 'recent'
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'implemented'

  // Mock suggestions data
  const [suggestions, setSuggestions] = useState([
    {
      id: 1,
      title: 'Use TypeScript for better type safety',
      content: 'I noticed the codebase is in JavaScript. Migrating to TypeScript would catch bugs earlier and improve developer experience.',
      context: 'feature',
      targetId: null,
      targetName: null,
      votes: 47,
      comments: 8,
      implemented: false,
      author: { name: 'Alex Developer', avatar: '👨' },
      timeAgo: '2 days ago'
    },
    {
      id: 2,
      title: 'Add dark mode toggle',
      content: 'A dark mode option would be great for users working at night. Current design is only light mode.',
      context: 'feature',
      targetId: null,
      targetName: null,
      votes: 32,
      comments: 5,
      implemented: false,
      author: { name: 'Sarah Designer', avatar: '👩' },
      timeAgo: '1 week ago'
    },
    {
      id: 3,
      title: 'Improve login performance',
      content: 'Login takes 3-4 seconds. Consider caching JWT tokens or optimizing the auth flow.',
      context: 'task',
      targetId: 'task-123',
      targetName: 'Authentication System',
      votes: 28,
      comments: 12,
      implemented: true,
      author: { name: 'Mike Engineer', avatar: '🧑' },
      timeAgo: '3 weeks ago'
    },
    {
      id: 4,
      title: 'Add export to CSV feature',
      content: 'Users should be able to export their data as CSV for backup and analysis purposes.',
      context: 'feature',
      targetId: null,
      targetName: null,
      votes: 19,
      comments: 3,
      implemented: false,
      author: { name: 'Emma Product', avatar: '👩' },
      timeAgo: '5 days ago'
    }
  ]);

  const handleSubmitSuggestion = async (suggestionData) => {
    console.log('Submitting suggestion:', suggestionData);
    // TODO: API call to submit suggestion
    const newSuggestion = {
      id: suggestions.length + 1,
      ...suggestionData,
      votes: 0,
      comments: 0,
      implemented: false,
      author: { name: 'You', avatar: '👤' },
      timeAgo: 'Just now'
    };
    setSuggestions([newSuggestion, ...suggestions]);
  };

  const handleVote = (suggestionId) => {
    setSuggestions(suggestions.map(s => 
      s.id === suggestionId ? { ...s, votes: s.votes + 1 } : s
    ));
  };

  const handleImplement = async (suggestionId) => {
    // TODO: API call to mark as implemented
    setSuggestions(suggestions.map(s => 
      s.id === suggestionId ? { ...s, implemented: true } : s
    ));
  };

  // Filter and sort
  let filteredSuggestions = suggestions;
  if (filter === 'pending') {
    filteredSuggestions = suggestions.filter(s => !s.implemented);
  } else if (filter === 'implemented') {
    filteredSuggestions = suggestions.filter(s => s.implemented);
  }

  if (sortBy === 'votes') {
    filteredSuggestions = [...filteredSuggestions].sort((a, b) => b.votes - a.votes);
  } else {
    // Sort by recent (reverse order for demo)
    filteredSuggestions = [...filteredSuggestions].reverse();
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Next Moves</h2>
            <p className="text-sm text-slate-400">
              {isPublicProject ? 'Community ideas and next actions for this project' : 'Ideas and next actions from the community'}
            </p>
          </div>
        </div>

        {isPublicProject && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Suggest
          </button>
        )}
      </div>

      {/* Filters & Sort */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'all' 
                ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/30' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'pending' 
                ? 'bg-orange-500/20 text-orange-400 border-2 border-orange-500/30' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('implemented')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'implemented' 
                ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/30' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Done
          </button>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setSortBy('votes')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              sortBy === 'votes' 
                ? 'bg-purple-500/20 text-purple-400' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Top Voted
          </button>
          <button
            onClick={() => setSortBy('recent')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              sortBy === 'recent' 
                ? 'bg-purple-500/20 text-purple-400' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            Recent
          </button>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No next moves yet</p>
            {isPublicProject && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition-all"
              >
                Be the first to suggest!
              </button>
            )}
          </div>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onVote={handleVote}
              onImplement={handleImplement}
              canImplement={isProjectMember}
            />
          ))
        )}
      </div>

      {/* Suggestion Form Modal */}
      {showForm && (
        <SuggestionForm
          projectId={projectId}
          onSubmit={handleSubmitSuggestion}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default SuggestionsPanel;