
// src/components/suggestions/SuggestionsPanel.jsx

import React, { useState, useEffect, useMemo } from 'react';

import { Lightbulb, Plus, TrendingUp, Clock } from 'lucide-react';

import SuggestionCard from './SuggestionCard';

import SuggestionForm from './SuggestionForm';

import { getSuggestions, createSuggestion, updateSuggestion, deleteSuggestion, upvoteSuggestion } from '../../api/suggestions';

import { createTask } from '../../api/projects';

import { useAuth } from '../../context/AuthContext';

import { toast } from '../ui/toast';

 

const SuggestionsPanel = ({ projectId, project }) => {

  const { user } = useAuth();

 

  const [suggestions, setSuggestions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [sortBy, setSortBy] = useState('votes');

  const [filter, setFilter] = useState('all');

 

  const { isMember, canModerate, isPublicProject, isFollowing } = useMemo(() => {

    if (!project || !user) return { isMember: false, canModerate: false, isPublicProject: false, isFollowing: false };

 

    const userId = user.id || user._id;

    const isOwner = project.ownerId === userId || project.owner?._id === userId;

 

    let isMemberFlag = isOwner;

    let isAdminFlag = isOwner;

 

    if (project.members) {

      project.members.forEach(m => {

        const mId = m.userId?._id || m.userId || m._id || m;

        if (mId === userId) {

          isMemberFlag = true;

          if (m.role === 'admin') isAdminFlag = true;

        }

      });

    }

 

    const isFollowingFlag = project.followers?.some(f => {

      const fId = f.userId?._id || f.userId || f._id || f;

      return fId === userId;

    });

 

    return {

      isMember: isMemberFlag,

      canModerate: isAdminFlag,

      isPublicProject: project.visibility === 'public',

      isFollowing: isFollowingFlag

    };

  }, [project, user]);

 

  const canSuggest = isMember || (isPublicProject && isFollowing);

 

  useEffect(() => {

    let isMounted = true;

    const loadData = async () => {

      if (!projectId) return;

      try {

        setLoading(true);

        const data = await getSuggestions(projectId);

        if (isMounted) setSuggestions(data || []);

      } catch (err) {

        if (isMounted) toast({ title: "Failed to load suggestions", variant: "error" });

      } finally {

        if (isMounted) setLoading(false);

      }

    };

    loadData();

    return () => { isMounted = false; };

  }, [projectId]);

 

  const handleSubmitSuggestion = async (suggestionData) => {

    try {

      const newSugg = await createSuggestion(projectId, { title: suggestionData.title, content: suggestionData.content });

      setSuggestions(prev => [newSugg, ...prev]);

      setShowForm(false);

      toast({ title: "Suggestion posted!", description: "It is now awaiting review.", variant: "success" });

    } catch (err) {

      toast({ title: "Failed to post suggestion", description: err.message, variant: "error" });

    }

  };

 

  const handleVote = async (suggestionId) => {

    try {

      const result = await upvoteSuggestion(projectId, suggestionId);

      setSuggestions(prev => prev.map(s => {

        const id = s.id || s._id;

        if (id === suggestionId) {

          return { ...s, upvotes: result.upvotes || s.upvotes };

        }

        return s;

      }));

    } catch (err) {

      toast({ title: "Vote failed", variant: "error" });

    }

  };

 

  const handleUpdateVisibility = async (suggestionId, newVisibility) => {

    setSuggestions(prev => prev.map(s => {

      const id = s.id || s._id;

      return id === suggestionId ? { ...s, visibility: newVisibility } : s;

    }));

    try {

      await updateSuggestion(projectId, suggestionId, { visibility: newVisibility });

      toast({ title: `Visibility set to ${newVisibility}`, variant: "success" });

    } catch (err) {

      toast({ title: "Failed to update visibility", variant: "error" });

    }

  };

 

  const handleImplement = async (suggestionId) => {

    setSuggestions(prev => prev.map(s => {

      const id = s.id || s._id;

      return id === suggestionId ? { ...s, status: 'completed' } : s;

    }));

    try {

      await updateSuggestion(projectId, suggestionId, { status: 'completed' });

    } catch (err) {

      toast({ title: "Failed to mark as implemented", variant: "error" });

    }

  };

 

  const handleDelete = async (suggestionId) => {

    setSuggestions(prev => prev.filter(s => (s.id || s._id) !== suggestionId));

    try {

      await deleteSuggestion(projectId, suggestionId);

      toast({ title: "Suggestion rejected and deleted", variant: "default" });

    } catch (err) {

      toast({ title: "Failed to delete", variant: "error" });

    }

  };

 

  const handleConvertToTask = async (suggestion) => {

    const sId = suggestion.id || suggestion._id;

    try {

      await createTask(projectId, {

        title: `[Suggestion] ${suggestion.title}`,

        status: 'backlog',

        description: suggestion.content

      });

      await handleImplement(sId);

      toast({ title: "Converted to Task!", description: "Check your Stack view.", variant: "success" });

    } catch (err) {

      toast({ title: "Failed to convert to task", variant: "error" });

    }

  };

 

  let filteredSuggestions = [...suggestions];

 

  if (filter === 'pending') {

    filteredSuggestions = filteredSuggestions.filter(s => s.status !== 'completed' && !s.implemented);

  } else if (filter === 'implemented') {

    filteredSuggestions = filteredSuggestions.filter(s => s.status === 'completed' || s.implemented);

  }

 

  if (sortBy === 'votes') {

    filteredSuggestions.sort((a, b) => {

      const aVotes = (a.votes || 0) + (a.upvotes?.length || 0);

      const bVotes = (b.votes || 0) + (b.upvotes?.length || 0);

      return bVotes - aVotes;

    });

  } else {

    filteredSuggestions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  }

 

  return (

    <div className="bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">

      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-3">

          <div className="p-2 bg-violet-50 dark:bg-violet-500/15 rounded-lg border border-violet-100 dark:border-violet-500/20">

            <Lightbulb className="w-5 h-5 text-violet-600 dark:text-violet-400" />

          </div>

          <div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Suggestions</h2>

            <p className="text-sm text-slate-500 dark:text-white/40">

              {isPublicProject ? 'Community feedback for this project' : 'Internal ideas & requests'}

            </p>

          </div>

        </div>

 

        {canSuggest ? (

          <button

            onClick={() => setShowForm(true)}

            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm"

          >

            <Plus className="w-4 h-4" />

            Suggest

          </button>

        ) : (

          isPublicProject && !isFollowing && (

            <div className="text-xs text-slate-400 dark:text-white/30 bg-slate-50 dark:bg-white/[0.04] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.06]">

              Follow project to suggest

            </div>

          )

        )}

      </div>

 

      <div className="flex items-center flex-wrap gap-4 mb-6">

        <div className="flex gap-1 bg-slate-50 dark:bg-white/[0.04] p-1 rounded-xl border border-slate-200 dark:border-white/[0.06]">

          <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/[0.08]' : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/60'}`}>All</button>

          <button onClick={() => setFilter('pending')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'pending' ? 'bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/[0.08]' : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/60'}`}>Pending</button>

          <button onClick={() => setFilter('implemented')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'implemented' ? 'bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/[0.08]' : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/60'}`}>Done</button>

        </div>

 

        <div className="ml-auto flex gap-2">

          <button onClick={() => setSortBy('votes')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${sortBy === 'votes' ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20' : 'bg-white dark:bg-white/[0.04] text-slate-500 dark:text-white/40 border-slate-200 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.06]'}`}>

            <TrendingUp className="w-4 h-4" /> Top

          </button>

          <button onClick={() => setSortBy('recent')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${sortBy === 'recent' ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20' : 'bg-white dark:bg-white/[0.04] text-slate-500 dark:text-white/40 border-slate-200 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.06]'}`}>

            <Clock className="w-4 h-4" /> Recent

          </button>

        </div>

      </div>

 

      <div className="space-y-4 min-h-[200px]">

        {loading ? (

          <div className="flex justify-center py-12">

            <div className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-600 animate-spin" />

          </div>

        ) : filteredSuggestions.length === 0 ? (

          <div className="text-center py-12 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-slate-200 dark:border-white/[0.06]">

            <Lightbulb className="w-10 h-10 text-slate-400 dark:text-white/20 mx-auto mb-3" />

            <p className="text-slate-500 dark:text-white/40 text-sm">No suggestions found.</p>

          </div>

        ) : (

          filteredSuggestions.map((suggestion) => (

            <SuggestionCard

              key={suggestion.id || suggestion._id}

              projectId={projectId}

              suggestion={suggestion}

              onVote={handleVote}

              onImplement={handleImplement}

              onUpdateVisibility={handleUpdateVisibility}

              onDelete={handleDelete}

              onConvertToTask={handleConvertToTask}

              canImplement={canModerate}

              canModerate={canModerate}

            />

          ))

        )}

      </div>

 

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

