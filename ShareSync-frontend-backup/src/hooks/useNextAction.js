// src/hooks/useNextAction.js - SEASON-AWARE VERSION
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useNextAction - Determines the user's next micro-step (SEASON-AWARE)
 * 
 * Priority logic:
 * 1. Overdue tasks (red - urgent)
 * 2. Tasks due today (orange)
 * 3. Projects in "Shipping" season with deadline awareness
 * 4. Recently updated projects with season context
 * 5. Default: "Start your day"
 */
export default function useNextAction() {
  const [nextAction, setNextAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchNextAction() {
      try {
        setLoading(true);

        // ⭐ PRIORITY 1: Check for overdue tasks
        const overdueTasks = await fetchOverdueTasks();
        if (overdueTasks && overdueTasks.length > 0) {
          const task = overdueTasks[0];
          setNextAction({
            type: 'task',
            priority: 'urgent',
            label: `Overdue: ${task.title}`,
            action: () => navigate(`/projects/${task.projectId}`),
            icon: '🚨',
            color: 'text-red-500',
          });
          setLoading(false);
          return;
        }

        // ⭐ PRIORITY 2: Tasks due today
        const todayTasks = await fetchTodayTasks();
        if (todayTasks && todayTasks.length > 0) {
          const task = todayTasks[0];
          setNextAction({
            type: 'task',
            priority: 'high',
            label: `Due today: ${task.title}`,
            action: () => navigate(`/projects/${task.projectId}`),
            icon: '⏰',
            color: 'text-orange-500',
          });
          setLoading(false);
          return;
        }

        // ⭐ PRIORITY 3: Shipping projects with tasks (SEASON-AWARE)
        const shippingProjects = await fetchShippingProjects();
        if (shippingProjects && shippingProjects.length > 0) {
          const project = shippingProjects[0];
          const nextTask = project.tasks?.[0];
          
          // ⭐ Calculate urgency based on deadline
          const deadline = project.deadline ? new Date(project.deadline) : null;
          const daysUntilDeadline = deadline 
            ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))
            : null;

          let icon = '🚢';
          let color = 'text-blue-500';
          let priority = 'medium';

          if (daysUntilDeadline !== null) {
            if (daysUntilDeadline <= 0) {
              icon = '🚨';
              color = 'text-red-500';
              priority = 'urgent';
            } else if (daysUntilDeadline <= 2) {
              icon = '🔥';
              color = 'text-orange-500';
              priority = 'high';
            }
          }

          setNextAction({
            type: 'project',
            priority,
            label: nextTask ? `Ship: ${nextTask.title}` : `Ship: ${project.name}`,
            action: () => navigate(`/projects/${project._id || project.id}`),
            icon,
            color,
            season: 'Shipping', // ⭐ NEW: Season metadata
          });
          setLoading(false);
          return;
        }

        // ⭐ PRIORITY 4: Recently active projects (SEASON-AWARE)
        const recentProjects = await fetchRecentProjects();
        if (recentProjects && recentProjects.length > 0) {
          const project = recentProjects[0];
          const season = project.season || project.phase;
          
          // ⭐ Adjust messaging based on season
          let icon = '📝';
          let label = `Continue: ${project.name}`;
          let color = 'text-purple-500';

          if (season === 'Exploring') {
            icon = '💡';
            label = `Explore: ${project.name}`;
            color = 'text-blue-400';
          } else if (season === 'Maintaining') {
            icon = '🔧';
            label = `Maintain: ${project.name}`;
            color = 'text-green-400';
          }

          setNextAction({
            type: 'project',
            priority: 'low',
            label,
            action: () => navigate(`/projects/${project._id || project.id}`),
            icon,
            color,
            season, // ⭐ NEW: Season metadata
          });
          setLoading(false);
          return;
        }

        // ⭐ DEFAULT: Start your day
        setNextAction({
          type: 'default',
          priority: 'low',
          label: 'Plan your day',
          action: () => navigate('/home'),
          icon: '☀️',
          color: 'text-slate-400',
        });

      } catch (error) {
        console.error('[useNextAction] Error:', error);
        // Fallback on error
        setNextAction({
          type: 'default',
          priority: 'low',
          label: 'View projects',
          action: () => navigate('/projects'),
          icon: '📂',
          color: 'text-slate-400',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchNextAction();
  }, [navigate]);

  return { nextAction, loading };
}

// ====================================================================
// HELPER FUNCTIONS - API CALLS
// ====================================================================

async function fetchOverdueTasks() {
  try {
    const token = localStorage.getItem('ss.jwt');
    if (!token) return [];

    const response = await fetch('http://localhost:3000/api/tasks/overdue', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.tasks || [];
  } catch (error) {
    console.error('[fetchOverdueTasks] Error:', error);
    return [];
  }
}

async function fetchTodayTasks() {
  try {
    const token = localStorage.getItem('ss.jwt');
    if (!token) return [];

    const response = await fetch('http://localhost:3000/api/tasks/today', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.tasks || [];
  } catch (error) {
    console.error('[fetchTodayTasks] Error:', error);
    return [];
  }
}

async function fetchShippingProjects() {
  try {
    const token = localStorage.getItem('ss.jwt');
    if (!token) return [];

    const response = await fetch('http://localhost:3000/api/projects?season=Shipping', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.projects || data || [];
  } catch (error) {
    console.error('[fetchShippingProjects] Error:', error);
    return [];
  }
}

async function fetchRecentProjects() {
  try {
    const token = localStorage.getItem('ss.jwt');
    if (!token) return [];

    const response = await fetch('http://localhost:3000/api/projects?sort=recent&limit=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.projects || data || [];
  } catch (error) {
    console.error('[fetchRecentProjects] Error:', error);
    return [];
  }
}