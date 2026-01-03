import { useEffect, useRef, useState } from 'react';

const useSwipeGesture = (onSwipeUp, onSwipeDown) => {
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
      setIsSwiping(true);
    };

    const handleTouchMove = (e) => {
      touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      setIsSwiping(false);
      
      const swipeDistance = touchStartY.current - touchEndY.current;
      const minSwipeDistance = 100; // pixels

      if (Math.abs(swipeDistance) < minSwipeDistance) {
        return; // Not a swipe
      }

      if (swipeDistance > 0) {
        // Swiped up
        onSwipeUp?.();
      } else {
        // Swiped down
        onSwipeDown?.();
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeUp, onSwipeDown]);

  return { isSwiping };
};

export default useSwipeGesture;
