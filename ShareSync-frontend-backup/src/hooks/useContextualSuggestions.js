import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useContextualSuggestions() {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simple default suggestion
    setSuggestion({
      icon: '☀️',
      label: 'Start your day',
      color: 'text-blue-400',
      action: () => navigate('/home'),
    });
    setLoading(false);
  }, [navigate]);

  return { suggestion, loading };
}
