// src/pages/Community.jsx - Week 9 Day 1-2
import React, { useState } from 'react';
import { Lightbulb, Sparkles, Plus, Search, TrendingUp, Fire } from 'lucide-react';
import { useIsMobile } from '../hooks/useMobile';
import TipSubmission from '../components/community/TipSubmission';
import TipCard from '../components/community/TipCard';
import TemplateCreation from '../components/community/TemplateCreation';
import TemplateCard from '../components/community/TemplateCard';
import { toast } from '../components/ui/toast';

const Community = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('tips'); // 'tips' or 'templates'
  const [showTipSubmission, setShowTipSubmission] = useState(false);
  const [showTemplateCreation, setShowTemplateCreation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const [tips] = useState([
    {
      id: 1,
      title: 'How I Maintain a 100-Day Streak',
      content: `The secret is simple: make it so easy you can't say no.

1. Set ridiculously small daily goals
2. Do them first thing in the morning
3. Never break the chain, even if it's just 1 minute
4. Celebrate every single day

Your streak becomes your identity. You become "the person who ships every day."`,
      category: 'streaks',
      author: 'Sarah Chen',
      timeAgo: '2h ago',
      likes: 124,
      comments: 18,
      views: 892,
      tags: ['streaks', 'consistency', 'habits']
    },
    {
      id: 2,
      title: 'Deep Work Protocol for Students',
      content: `As a college student, I discovered this works:

📱 Phone in another room (not silent, GONE)
⏰ 90-minute blocks max
☕ Coffee BEFORE starting, not during
🎵 Same playlist every time (builds trigger)
📝 Clear outcome defined before starting

The key: make it a ritual. Same time, same place, same music.`,
      category: 'focus',
      author: 'Mike Rodriguez',
      timeAgo: '5h ago',
      likes: 87,
      comments: 12,
      views: 654,
      tags: ['focus', 'deep-work', 'students']
    }
  ]);

  const [templates] = useState([
    {
      id: 1,
      name: 'College Semester Template',
      description: 'Complete workflow for managing a college semester: classes, assignments, exams, and projects.',
      category: 'school',
      author: 'Alex Kim',
      uses: 1247,
      tasks: [
        { title: 'Set up class schedule', completed: false },
        { title: 'Add all assignment deadlines', completed: false },
        { title: 'Create study groups for each class', completed: false },
        { title: 'Set up weekly review sessions', completed: false }
      ]
    },
    {
      id: 2,
      name: 'Startup Launch Template',
      description: 'Everything you need to launch a startup from idea to first customer.',
      category: 'work',
      author: 'Jordan Lee',
      uses: 892,
      tasks: [
        { title: 'Validate idea with 10 customer interviews', completed: false },
        { title: 'Build MVP', completed: false },
        { title: 'Get first 10 users', completed: false },
        { title: 'Launch on Product Hunt', completed: false }
      ]
    }
  ]);

  const handleSubmitTip = async (tip) => {
    console.log('Submitting tip:', tip);
    // TODO: API call to submit tip
  };

  const handleCreateTemplate = async (template) => {
    console.log('Creating template:', template);
    // TODO: API call to create template
  };

  const handleLikeTip = (tipId) => {
    console.log('Liked tip:', tipId);
    // TODO: API call to like tip
  };

  const handleUseTemplate = (template) => {
    toast({
      title: '✨ Template copied!',
      description: 'Creating new project from template...',
      variant: 'success'
    });
    // TODO: Create project from template
  };

  const filteredTips = tips.filter(tip =>
    tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tip.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617, #0f172a, #020617)' }} className="text-white pb-20">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-6'} py-8`}>
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent mb-3">
            Community
          </h1>
          <p className="text-slate-400 text-lg">Learn from productive people. Share what works for you.</p>
        </div>

        {/* Search & Add Buttons */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tips and templates..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => activeTab === 'tips' ? setShowTipSubmission(true) : setShowTemplateCreation(true)}
            className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {activeTab === 'tips' ? 'Share a Tip' : 'Create Template'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('tips')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'tips'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Tips ({tips.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'templates'
                ? 'text-pink-400 border-b-2 border-pink-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Templates ({templates.length})
            </div>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'tips' ? (
          <div className="space-y-6">
            {filteredTips.length === 0 ? (
              <div className="text-center py-12">
                <Lightbulb className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No tips found</p>
              </div>
            ) : (
              filteredTips.map((tip) => (
                <TipCard
                  key={tip.id}
                  tip={tip}
                  onLike={handleLikeTip}
                />
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No templates found</p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={handleUseTemplate}
                />
              ))
            )}
          </div>
        )}

        {/* Modals */}
        {showTipSubmission && (
          <TipSubmission
            onSubmit={handleSubmitTip}
            onClose={() => setShowTipSubmission(false)}
          />
        )}

        {showTemplateCreation && (
          <TemplateCreation
            onSubmit={handleCreateTemplate}
            onClose={() => setShowTemplateCreation(false)}
          />
        )}

      </div>
    </div>
  );
};

export default Community;
