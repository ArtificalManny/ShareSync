import React, { useState } from 'react';
import { X, Rocket, CheckCircle, Trophy, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';

const TeamStories = ({ hideMockData = false, className = '' }) => {
  const isMobile = useIsMobile();
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Full stories array with mock data - using Unicode escape sequences for reliability
  const allStories = [
    { 
      userId: '1', 
      username: 'You', 
      avatar: '\u{1F464}', 
      hasNew: true, 
      isOwn: true, 
      slides: [ 
        { type: 'ship', content: 'Fixed login bug', project: 'ShareSync v2', xp: 50, timestamp: '2h ago', emoji: '\u{1F680}' }, 
        { type: 'task', content: 'Completed 5 tasks', project: 'Mobile App', xp: 25, timestamp: '4h ago', emoji: '\u{2705}' } 
      ] 
    },
    { 
      userId: '2', 
      username: 'Sarah', 
      avatar: '\u{1F469}', 
      hasNew: true, 
      isMock: true, 
      slides: [ 
        { type: 'milestone', content: 'Hit 100-day streak!', project: null, xp: 500, timestamp: '1h ago', emoji: '\u{1F525}' } 
      ] 
    },
    { 
      userId: '3', 
      username: 'Mike', 
      avatar: '\u{1F468}', 
      hasNew: true, 
      isMock: true, 
      slides: [ 
        { type: 'ship', content: 'Deployed v2.0 to production', project: 'AI Writing Tool', xp: 100, timestamp: '30m ago', emoji: '\u{1F680}' } 
      ] 
    },
    { 
      userId: '4', 
      username: 'Alex', 
      avatar: '\u{1F9D1}', 
      hasNew: false, 
      isMock: true, 
      slides: [] 
    }
  ];

  // Filter out mock data if hideMockData is true
  const stories = hideMockData 
    ? allStories.filter(story => !story.isMock)
    : allStories;

  // If hideMockData and only "You" story remains with no slides, hide component
  if (hideMockData && stories.length <= 1 && (!stories[0]?.slides?.length || stories[0]?.slides?.length === 0)) {
    return null;
  }

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
      // Find next story with slides
      let nextIndex = selectedStory + 1;
      while (nextIndex < stories.length && stories[nextIndex].slides.length === 0) {
        nextIndex++;
      }
      if (nextIndex < stories.length) {
        setSelectedStory(nextIndex); 
        setCurrentSlide(0);
      } else {
        handleClose();
      }
    } else { 
      handleClose(); 
    } 
  };
  
  const handlePrev = () => { 
    if (currentSlide > 0) { 
      setCurrentSlide(currentSlide - 1); 
    } else if (selectedStory > 0) { 
      // Find previous story with slides
      let prevIndex = selectedStory - 1;
      while (prevIndex >= 0 && stories[prevIndex].slides.length === 0) {
        prevIndex--;
      }
      if (prevIndex >= 0) {
        setSelectedStory(prevIndex); 
        const prevStory = stories[prevIndex]; 
        setCurrentSlide(prevStory.slides.length - 1);
      }
    } 
  };

  return (
    <>
      <div className={`bg-white dark:bg-surface-1 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm ${className}`}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-text-primary text-base leading-tight">Team Activity</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-text-tertiary">What the network shipped today</p>
          </div>
        </div>

        {/* Story circles */}
        <div className="flex gap-5 overflow-x-auto pb-2 hide-scrollbar">
          {stories.map((story, index) => (
            <button
              key={story.userId}
              onClick={() => handleStoryClick(story, index)}
              className="flex-shrink-0 group flex flex-col items-center gap-2"
              disabled={story.slides.length === 0}
            >
              <div className="relative">
                {/* Ring indicator */}
                <div className={`
                  w-16 h-16 md:w-20 md:h-20 rounded-full p-0.5 transition-transform duration-200
                  ${story.hasNew 
                    ? 'bg-gradient-to-tr from-violet-500 via-purple-500 to-pink-500' 
                    : 'bg-slate-200 dark:bg-white/[0.1]'
                  }
                  ${story.slides.length === 0 ? 'opacity-40 grayscale' : 'group-hover:scale-105 group-active:scale-95'}
                `}>
                  <div className="w-full h-full rounded-full bg-white dark:bg-surface-1 border-2 border-white dark:border-surface-1 flex items-center justify-center">
                    <span className="text-2xl md:text-3xl drop-shadow-sm">{story.avatar}</span>
                  </div>
                </div>
                
                {story.hasNew && story.slides.length > 0 && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-pink-500 border-2 border-white dark:border-surface-1 rounded-full shadow-sm" />
                )}
              </div>
              
              <p className={`text-xs text-center max-w-[72px] truncate ${
                story.hasNew ? 'text-slate-800 dark:text-text-primary font-bold' : 'text-slate-500 dark:text-text-tertiary font-medium'
              }`}>
                {story.isOwn ? 'Your story' : story.username}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal - Kept dark for cinematic focus */}
      {selectedStory !== null && stories[selectedStory]?.slides?.length > 0 && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center">
          <div className="relative w-full max-w-lg h-full max-h-[90vh] flex flex-col">
            {/* Progress bars */}
            <div className="flex gap-2 p-4 pb-2 z-10">
              {stories[selectedStory].slides.map((_, idx) => (
                <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-white transition-all duration-300 ${
                      idx === currentSlide ? 'w-full' : idx < currentSlide ? 'w-full' : 'w-0'
                    }`} 
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                    <span className="text-xl">{stories[selectedStory].avatar}</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-white text-sm shadow-sm">
                    {stories[selectedStory].isOwn ? 'You' : stories[selectedStory].username}
                  </p>
                  <p className="text-xs font-medium text-white/70 drop-shadow-sm">
                    {stories[selectedStory].slides[currentSlide]?.timestamp}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleClose} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-8 relative">
              {stories[selectedStory].slides[currentSlide] && (
                <div className="text-center animate-in fade-in zoom-in duration-300">
                  <div className="text-7xl mb-6 drop-shadow-lg scale-110">
                    {stories[selectedStory].slides[currentSlide].emoji}
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3 tracking-tight drop-shadow-md">
                    {stories[selectedStory].slides[currentSlide].content}
                  </h3>
                  {stories[selectedStory].slides[currentSlide].project && (
                    <p className="font-medium text-white/70 mb-6 uppercase tracking-widest text-sm">
                      {stories[selectedStory].slides[currentSlide].project}
                    </p>
                  )}
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full shadow-xl">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="text-lg font-bold text-white">
                      +{stories[selectedStory].slides[currentSlide].xp} XP
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <button 
              onClick={handlePrev} 
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full transition-all active:scale-90 disabled:opacity-30" 
              disabled={selectedStory === 0 && currentSlide === 0}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button 
              onClick={handleNext} 
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full transition-all active:scale-90"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
};

export default TeamStories;
