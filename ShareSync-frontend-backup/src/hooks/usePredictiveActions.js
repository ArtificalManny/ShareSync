import { useState } from 'react';

export default function usePredictiveActions() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  return { prediction, loading };
}
