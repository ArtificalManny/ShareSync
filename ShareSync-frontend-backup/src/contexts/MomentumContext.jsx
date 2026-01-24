import React, { createContext, useContext, useState } from 'react';

const MomentumContext = createContext();

export const useMomentumContext = () => {
  const context = useContext(MomentumContext);
  if (!context) return { glowLevel: 2, isFireMode: false, momentum: 1 };
  return context;
};

// ⭐ Added missing export for Home.jsx
export const useMomentumActivity = () => {
  const context = useContext(MomentumContext);
  const recordTaskCompletion = () => {
    console.log("Momentum Activity: Task Completed");
    // You can add logic here to increase momentum score
  };
  return { recordTaskCompletion };
};

export const MomentumProvider = ({ children }) => {
  const [momentum, setMomentum] = useState(1);
  const [isFireMode, setIsFireMode] = useState(false);
  const glowLevel = isFireMode ? 5 : 2;

  const recordActivity = (type, payload) => {
    console.log(`Activity Recorded: ${type}`, payload);
  };

  return (
    <MomentumContext.Provider value={{ 
      momentum, 
      setMomentum, 
      isFireMode, 
      setIsFireMode, 
      glowLevel,
      recordActivity,
      glowState: isFireMode ? 'fire' : 'normal',
      message: isFireMode ? 'You are on fire!' : 'Keep it up',
      score: 100
    }}>
      {children}
    </MomentumContext.Provider>
  );
};
