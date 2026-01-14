import React, { createContext, useContext, useState, useEffect } from 'react';

const RenovationContext = createContext();

export const RenovationProvider = ({ children }) => {
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);

  // These are strictly CSS class strings. No logic, no backend.
  const metaLabStyles = {
    card: "bento-elevated",
    label: "text-label-caps",
    heading: "tracking-tighter font-bold",
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <RenovationContext.Provider value={{ 
      styles: metaLabStyles,
      isCommandBarOpen,
      setIsCommandBarOpen
    }}>
      {children}
    </RenovationContext.Provider>
  );
};

export const useRenovation = () => {
  const context = useContext(RenovationContext);
  if (!context) return { styles: {} }; // Safety fallback
  return context;
};
