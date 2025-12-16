import { useState, useEffect } from 'react';

export default function useEnergyAdaptation() {
  const [energyData, setEnergyData] = useState({
    score: 75,
    level: 'high',
    trend: 'stable',
    recommendation: null,
    history: [],
  });
  const [loading, setLoading] = useState(false);

  return { energyData, loading };
}
