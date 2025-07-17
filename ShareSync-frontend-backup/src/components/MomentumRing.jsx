// src/components/MomentumRing.jsx
export default function MomentumRing({ streakDays = 0 }) {
    const percentage = Math.min((streakDays / 30) * 100, 100);
  
    return (
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            className="text-gray-300"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-indigo-500"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            🔥 {streakDays}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Day Streak</span>
        </div>
      </div>
    );
  }  