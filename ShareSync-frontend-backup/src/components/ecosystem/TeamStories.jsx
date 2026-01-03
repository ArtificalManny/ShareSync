import React, { useState } from 'react';
import { X, Rocket, CheckCircle, Trophy, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

const TeamStories = () => {
  const isMobile = useIsMobile();
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Mock data - will be replaced with real API
  const stories = [
    {
      userId: '1',
      username: 'You',
      avatar: '👤',
      hasNew: true,
      slides: [
        {
          type: 'ship',
          content: 'Fixed login bug',
          project: 'ShareSync v2',
          xp: 50,
          timestamp: '2h ago',
          emoji: '🚀'
        },
        {
          type: 'task',
          content: 'Completed 5 tasks',
          project: 'Mobile App',
          xp: 25,
          timestamp: '4h ago',
          emoji: '✅'
        }
      ]
    },
    {
      userId: '2',
      username: 'Sarah',
      avatar: '👩',
      hasNew: true,
      slides: [
        {
          type: 'milestone',
          content: 'Hit 100-day streak! 🎉',
          project: null,
          xp: 500,
          timestamp: '1h ago',
          emoji: '🔥'
        }
      ]
    },
    {
      userId: '3',
      username: 'Mike',
      avatar: '👨',
      hasNew: true,
      slides: [
        {
          type: 'ship',
          content: 'Deployed v2.0 to production',
          project: 'AI Writing Tool',
          xp: 100,
          timestamp: '30m ago',
          emoji: '🚀'
        }
      ]
    },
    {
      userId: '4',
      username: 'Alex',
      avatar: '🧑',
      hasNew: false,
      slides: []
    }
  ];

  const handleStoryClick = (story, index) => {
    if (story.slides.length === 0) return;
    setSelectedStory(index);
    setCurrentSlide(0);
  };

  const handleClose = () => {
    setSelectedStory(null);
    setCurrentSlide(0);
  };

  const handleNext = () => {
    const story = stories[selectedStory];
    if (currentSlide < story.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else if (selectedStory < stories.length - 1) {
      setSelectedStory(selectedStory + 1);
      setCurrentSlide(0);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    } else if (selectedStory > 0) {
      setSelectedStory(selectedStory - 1);
      const prevStory = stories[selectedStory - 1];
      setCurrentSlide(prevStory.slides.length - 1);
    }
  };

  return (
    <>
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-pink-600 rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Team Activity</h3>
            <p className="text-xs text-slate-400">What everyone shipped today</p>
          </div>
        </div>

        {/* Story circles */}
        <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
          {stories.map((story, index) => (
            <button
              key={story.userId}
              onClick={() => handleStoryClick(story, index)}
              className="flex-shrink-0 group"
              disabled={story.slides.length === 0}
            >
              <div className="relative mb-2">
                {/* Ring indicator */}
                <div className={`
                  w-20 h-20 rounded-full p-1 transition-all
                  ${story.hasNew 
                    ? 'bg-gradient-to-tr from-purple-600 to-fuchsia-600' 
                    : 'bg-slate-700'
                  }
                  ${story.slides.length === 0 ? 'opacity-50' : 'group-hover:scale-110'}
                `}>
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                    <span className="text-3xl">{story.avatar}</span>
                  </div>
                </div>
                
                {/* New indicator dot */}
                {story.hasNew && story.slides.length > 0 && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-purple-500 border-2 border-slate-900 rounded-full" />
                )}
              </div>
              
              <p className={`text-xs text-center ${
                story.hasNew ? 'text-white font-semibold' : 'text-slate-400'
              }`}>
                {story.username}
              </p>
            </button>
          ))}
        </div>

        {/* Quick stats */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Team activity today</span>
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-white">
                {stories.reduce((acc, s) => acc + s.slides.length, 0)} updates
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Story Viewer Modal */}
      {selectedStory !== null && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          {/* Story content */}
          <div className="relative w-full max-w-lg h-full max-h-[90vh] flex flex-col">
            {/* Progress bars */}
            <div className="flex gap-2 p-4 pb-2">
              {stories[selectedStory].slides.map((_, idx) => (
                <div key={idx} className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-white transition-all ${
                      idx === currentSlide ? 'w-full' : idx < currentSlide ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-600 p-0.5">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                    <span className="text-xl">{stories[selectedStory].avatar}</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-white">{stories[selectedStory].username}</p>
                  <p className="text-xs text-slate-400">
                    {stories[selectedStory].slides[currentSlide]?.timestamp}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Story slide */}
            <div className="flex-1 flex items-center justify-center p-8">
              {stories[selectedStory].slides[currentSlide] && (
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {stories[selectedStory].slides[currentSlide].emoji}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {stories[selectedStory].slides[currentSlide].content}
                  </h3>
                  {stories[selectedStory].slides[currentSlide].project && (
                    <p className="text-lg text-slate-400 mb-4">
                      {stories[selectedStory].slides[currentSlide].project}
                    </p>
                  )}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="text-lg font-bold text-white">
                      +{stories[selectedStory].slides[currentSlide].xp} XP
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors"
              disabled={selectedStory === 0 && currentSlide === 0}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default TeamStories;
