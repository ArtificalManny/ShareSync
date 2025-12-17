// src/hooks/useProjectTasks.js
import { useState, useEffect, useCallback } from 'react';
import * as projectsAPI from '../api/projects';
import socketService from '../services/socket';

export default function useProjectTasks(projectId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Load tasks
  useEffect(() => {
    if (projectId) {
      loadTasks();
    }
  }, [projectId]);

  // Set up socket listeners
  useEffect(() => {
    if (!projectId) return;

    socketService.onTaskCreated?.((task) => {
      console.log('[Socket] Task created:', task);
      setTasks(prev => [...prev, transformTask(task)]);
    });

    socketService.onTaskUpdated?.((task) => {
      console.log('[Socket] Task updated:', task);
      setTasks(prev => prev.map(t => 
        t._id === task._id ? transformTask(task) : t
      ));
    });

    socketService.onTaskCompleted?.((data) => {
      console.log('[Socket] Task completed:', data);
      setTasks(prev => prev.map(t => 
        t._id === data.task._id ? transformTask(data.task) : t
      ));
    });

    socketService.onTaskDeleted?.((data) => {
      console.log('[Socket] Task deleted:', data.taskId);
      setTasks(prev => prev.filter(t => t._id !== data.taskId));
    });

    return () => {
      // Cleanup listeners
    };
  }, [projectId]);

  const transformTask = useCallback((task) => ({
    _id: task._id,
    title: task.title,
    description: task.description,
    status: task.status,
    completed: task.completed,
    completedAt: task.completedAt,
    assignee: task.assignee,
    dueDate: task.dueDate,
    effort: task.effort,
    estimatedTime: task.estimatedTime,
    createdBy: task.createdBy,
    createdAt: task.createdAt
  }), []);

  async function loadTasks() {
    try {
      setLoading(true);
      setError(null);

      const data = await projectsAPI.getTasks(projectId);
      const transformed = data.map(transformTask);
      setTasks(transformed);
    } catch (err) {
      console.error('[useProjectTasks] Load error:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function createTask(taskData) {
    try {
      setCreating(true);
      setError(null);

      const newTask = await projectsAPI.createTask(projectId, taskData);
      const transformed = transformTask(newTask);
      
      setTasks(prev => [...prev, transformed]);
      return transformed;
    } catch (err) {
      console.error('[useProjectTasks] Create error:', err);
      setError('Failed to create task');
      throw err;
    } finally {
      setCreating(false);
    }
  }

  async function updateTask(taskId, updates) {
    try {
      const updatedTask = await projectsAPI.updateTask(projectId, taskId, updates);
      const transformed = transformTask(updatedTask);
      
      setTasks(prev => prev.map(t => 
        t._id === taskId ? transformed : t
      ));
      
      return transformed;
    } catch (err) {
      console.error('[useProjectTasks] Update error:', err);
      throw err;
    }
  }

  async function completeTask(taskId) {
    try {
      const result = await projectsAPI.completeTask(projectId, taskId);
      const transformed = transformTask(result.task);
      
      setTasks(prev => prev.map(t => 
        t._id === taskId ? transformed : t
      ));
      
      return result; // { task, xpAwarded }
    } catch (err) {
      console.error('[useProjectTasks] Complete error:', err);
      throw err;
    }
  }

  async function deleteTask(taskId) {
    try {
      await projectsAPI.deleteTask(projectId, taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      console.error('[useProjectTasks] Delete error:', err);
      throw err;
    }
  }

  return {
    tasks,
    loading,
    creating,
    error,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    refresh: loadTasks
  };
}

// Add socket event listeners to socket service
if (typeof socketService.onTaskCreated === 'undefined') {
  socketService.onTaskCreated = function(callback) {
    if (!this.socket) return;
    this.socket.on('task:created', callback);
  };

  socketService.onTaskUpdated = function(callback) {
    if (!this.socket) return;
    this.socket.on('task:updated', callback);
  };

  socketService.onTaskCompleted = function(callback) {
    if (!this.socket) return;
    this.socket.on('task:completed', callback);
  };

  socketService.onTaskDeleted = function(callback) {
    if (!this.socket) return;
    this.socket.on('task:deleted', callback);
  };
}
