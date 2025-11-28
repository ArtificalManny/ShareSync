import React, { useState, useEffect } from 'react';
import { Search, Plus, Flame, TrendingUp, Sparkles, Clock, Users, Zap } from 'lucide-react';
import ProjectCard from '../components/discovery/ProjectCard';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false); // Toggle this to true for testing
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('featured');
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'Alex', streak: '12d', xp: 2450, avatar: '👤' },
    { rank: 2, name: 'Jordan', streak: '10d', xp: 2200, avatar: '👤' },
    { rank: 3, name: 'You', streak: '7d', xp: 1850, avatar: '👤' }
  ]);
  const [currentLeaderIndex, setCurrentLeaderIndex] = useState(0);

  // Auto-cycle leaderboard every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLeaderIndex((prev) => (prev + 1) % leaderboard.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [leaderboard.length]);

  // Fetch projects
  useEffect(() => {
    fetchProjects();
  }, [selectedFilter, searchQuery]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Use mock data if enabled or if API fails
      if (useMockData) {
        setProjects(getMockProjects());
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.warn('Projects API returned non-200:', response.status, '- using mock data');
        setProjects(getMockProjects());
        return;
      }
      
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching projects:', error, '- using mock data');
      setProjects(getMockProjects());
    } finally {
      setLoading(false);
    }
  };

  const getMockProjects = () => [
    {
      _id: '1',
      name: 'ShareSync v2',
      description: 'The momentum-based project tracker that keeps you shipping',
      owner: { _id: user?._id || '1', name: 'You' },
      status: 'active',
      streak: { value: 7 },
      momentum: { value: 85 },
      metrics: { onTimePercent: { value: 92 }, openTasks: { value: 5 }, throughputPerWeek: { value: 12 } },
      members: [{ _id: '1', name: 'You' }],
      updatedAt: new Date().toISOString()
    },
    {
      _id: '2',
      name: 'AI Writing Tool',
      description: 'GPT-powered content generation platform',
      owner: { _id: '2', name: 'Alex' },
      status: 'active',
      streak: { value: 120 },
      momentum: { value: 95 },
      metrics: { onTimePercent: { value: 88 }, openTasks: { value: 8 }, throughputPerWeek: { value: 15 } },
      members: [{ _id: '2', name: 'Alex' }, { _id: '3', name: 'Jordan' }],
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      _id: '3',
      name: 'No-Code SaaS Builder',
      description: 'Build and ship SaaS apps without writing code',
      owner: { _id: '3', name: 'Jordan' },
      status: 'active',
      streak: { value: 45 },
      momentum: { value: 78 },
      metrics: { onTimePercent: { value: 85 }, openTasks: { value: 12 }, throughputPerWeek: { value: 9 } },
      members: [{ _id: '3', name: 'Jordan' }],
      updatedAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      _id: '4',
      name: 'Fitness Tracking App',
      description: 'Track workouts, nutrition, and progress with AI insights',
      owner: { _id: '4', name: 'Sarah' },
      status: 'active',
      streak: { value: 89 },
      momentum: { value: 91 },
      metrics: { onTimePercent: { value: 94 }, openTasks: { value: 3 }, throughputPerWeek: { value: 18 } },
      members: [{ _id: '4', name: 'Sarah' }, { _id: '5', name: 'Mike' }],
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch(selectedFilter) {
      case 'my-projects':
        return matchesSearch && project.owner?._id === user?._id;
      case 'following':
        return matchesSearch; // Add following logic later
      case 'hot-streaks':
        return matchesSearch && project.streak?.value > 30;
      case 'just-shipped':
        return matchesSearch; // Add recent ships logic
      default:
        return matchesSearch;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      
      {/* HERO SECTION - Full Bleed */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 via-fuchsia-900/30 to-slate-900/40 border-b border-purple-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(139,92,246,0.1),transparent)]" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          {/* Title */}
          <h1 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
            YOUR MOMENTUM STARTS HERE
          </h1>

          {/* Leaderboard Carousel */}
          <div className="flex justify-center gap-4 mb-8">
            {leaderboard.slice(currentLeaderIndex, currentLeaderIndex + 3).map((leader, idx) => (
              <div 
                key={leader.rank}
                className={`
                  bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl 
                  border border-purple-500/30 rounded-2xl p-6 min-w-[200px]
                  transform transition-all duration-500
                  ${idx === 0 ? 'scale-110 border-purple-400/50' : 'scale-100'}
                `}
              >
                <div className="text-center">
                  <div className={`text-3xl mb-2 ${leader.rank === 1 ? 'animate-bounce' : ''}`}>
                    {leader.rank === 1 ? '🏆' : leader.rank === 2 ? '🥈' : '🥉'}
                  </div>
                  <div className="text-xl font-bold text-white">{leader.name}</div>
                  <div className="text-sm text-purple-300">{leader.streak} streak</div>
                  <div className="text-lg text-fuchsia-400 font-semibold">{leader.xp} XP</div>
                </div>
              </div>
            ))}
          </div>

          {/* Live Ticker */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-3 mb-6 overflow-hidden">
            <div className="flex gap-8 animate-marquee whitespace-nowrap">
              <span className="text-purple-300">🔥 Alex just hit 120d streak · 2450 XP</span>
              <span className="text-fuchsia-300">🚀 Jordan shipped v3 of SaaS · +420 momentum</span>
              <span className="text-emerald-300">⚡ Sarah hit $10k MRR milestone</span>
              <span className="text-purple-300">🔥 Alex just hit 120d streak · 2450 XP</span>
            </div>
          </div>

          {/* Giant Search Bar */}
          <div className="max-w-3xl mx-auto relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-400" />
            <input
              type="text"
              placeholder="Search projects, creators, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 backdrop-blur-xl border-2 border-purple-500/30 
                       rounded-2xl pl-16 pr-6 py-6 text-lg text-white placeholder-slate-400
                       focus:outline-none focus:border-purple-400/60 transition-all"
            />
          </div>

          {/* New Project Button */}
          <div className="flex justify-center mt-8">
            <button className="group relative bg-gradient-to-r from-purple-600 to-fuchsia-600 
                             hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold 
                             px-12 py-5 rounded-2xl text-xl transition-all transform hover:scale-105
                             shadow-lg shadow-purple-500/50">
              <Plus className="inline-block w-6 h-6 mr-2" />
              New Project
              <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </div>

      {/* THREE COLUMN LAYOUT */}
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          
          {/* LEFT RAIL - Quick Filters */}
          <div className="col-span-2 space-y-4 sticky top-6 h-fit">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">QUICK FILTERS</h3>
              
              {[
                { id: 'featured', label: 'Featured', icon: Sparkles },
                { id: 'my-projects', label: 'My Projects', icon: Users },
                { id: 'following', label: 'Following', icon: Users },
                { id: 'hot-streaks', label: 'Hot Streaks', icon: Flame },
                { id: 'just-shipped', label: 'Just Shipped', icon: Zap }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-2
                    transition-all text-left text-sm
                    ${selectedFilter === filter.id 
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' 
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                    }
                  `}
                >
                  <filter.icon className="w-4 h-4" />
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* CENTER - Infinite Grid */}
          <div className="col-span-7">
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📂</div>
                <h3 className="text-xl font-semibold text-white mb-2">No projects match your filters</h3>
                <p className="text-slate-400 mb-6">Try adjusting filters or start your first project.</p>
                <button className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl transition-all">
                  + New Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {filteredProjects.map(project => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            )}

            {/* Discovery Carousels */}
            {!loading && filteredProjects.length > 0 && (
              <div className="mt-12 space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Just Shipped (last 4 hours)
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {/* Add carousel cards here */}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    100d+ Streak Legends
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {/* Add carousel cards here */}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT RAIL - Personal Coach */}
          <div className="col-span-3 space-y-4 sticky top-6 h-fit">
            <div className="bg-gradient-to-br from-purple-900/40 to-fuchsia-900/40 backdrop-blur-sm 
                          border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Your Personal Coach</h3>
              
              <div className="space-y-4">
                <button className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 
                                rounded-lg transition-all font-semibold">
                  Start a 25-min sprint
                </button>

                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-300 mb-2">Your top project:</div>
                  <div className="text-white font-semibold">ShareSync v2</div>
                  <div className="text-xs text-purple-300 mt-1">7 day streak 🔥</div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-300 mb-2">Friends online:</div>
                  <div className="flex -space-x-2">
                    {['🟢', '🟢', '🟢'].map((dot, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 
                                             flex items-center justify-center text-xs">
                        {dot}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-orange-400 font-semibold mb-2">
                    <Flame className="w-4 h-4" />
                    Streak Protector
                  </div>
                  <div className="text-xs text-slate-300">
                    Ship something in the next 8 hours to keep your streak alive!
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM BAR - Momentum Cart */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900/95 to-purple-900/95 
                    backdrop-blur-xl border-t border-purple-500/30 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-white">
            You're falling behind <span className="text-purple-400 font-bold">Alex</span> by 
            <span className="text-fuchsia-400 font-bold ml-1">380 XP</span>
          </div>
          <div className="flex gap-4">
            <button className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-all">
              Start sprint
            </button>
            <button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 
                             hover:to-fuchsia-500 text-white px-6 py-2 rounded-lg transition-all font-semibold">
              Ship something → +50 XP
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Projects;