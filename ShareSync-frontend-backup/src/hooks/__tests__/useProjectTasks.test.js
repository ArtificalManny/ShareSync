import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useProjectTasks from '../useProjectTasks';
import * as projectsAPI from '../../api/projects';

// Mock the entire API module
vi.mock('../../api/projects');

// Mock socket service
vi.mock('../../services/socket', () => ({
  default: {
    onTaskCreated: vi.fn(),
    onTaskUpdated: vi.fn(),
    onTaskCompleted: vi.fn(),
    onTaskDeleted: vi.fn(),
  },
}));

describe('useProjectTasks', () => {
  const mockProjectId = 'project-123';
  const mockTask = {
    _id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'In Progress',
    completed: false,
    completedAt: null,
    assignee: 'user-1',
    dueDate: '2026-01-15',
    effort: 3,
    estimatedTime: 2,
    createdBy: 'user-1',
    createdAt: '2026-01-10',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock implementation
    vi.mocked(projectsAPI.getTasks).mockResolvedValue([]);
  });

  describe('Initial State', () => {
    it('initializes with empty tasks array', async () => {
      vi.mocked(projectsAPI.getTasks).mockResolvedValue([]);
      const { result } = renderHook(() => useProjectTasks(mockProjectId));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.tasks).toEqual([]);
    });

    it('initializes loading as true', () => {
      const { result } = renderHook(() => useProjectTasks(mockProjectId));
      expect(result.current.loading).toBe(true);
    });

    it('initializes creating as false', async () => {
      vi.mocked(projectsAPI.getTasks).mockResolvedValue([]);
      const { result } = renderHook(() => useProjectTasks(mockProjectId));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.creating).toBe(false);
    });
  });

  describe('Return Value Structure', () => {
    it('returns all expected properties', async () => {
      vi.mocked(projectsAPI.getTasks).mockResolvedValue([]);
      const { result } = renderHook(() => useProjectTasks(mockProjectId));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current).toHaveProperty('tasks');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('creating');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('createTask');
      expect(result.current).toHaveProperty('updateTask');
      expect(result.current).toHaveProperty('completeTask');
      expect(result.current).toHaveProperty('deleteTask');
      expect(result.current).toHaveProperty('refresh');
    });

    it('provides function types', async () => {
      vi.mocked(projectsAPI.getTasks).mockResolvedValue([]);
      const { result } = renderHook(() => useProjectTasks(mockProjectId));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(typeof result.current.createTask).toBe('function');
      expect(typeof result.current.updateTask).toBe('function');
      expect(typeof result.current.completeTask).toBe('function');
      expect(typeof result.current.deleteTask).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
    });
  });

  describe('Loading Behavior', () => {
    it('loads tasks on mount with projectId', async () => {
      vi.mocked(projectsAPI.getTasks).mockResolvedValue([mockTask]);
      const { result } = renderHook(() => useProjectTasks(mockProjectId));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(vi.mocked(projectsAPI.getTasks)).toHaveBeenCalledWith(mockProjectId);
    });

    it('does not load tasks without projectId', () => {
      renderHook(() => useProjectTasks(null));
      expect(vi.mocked(projectsAPI.getTasks)).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
      vi.mocked(projectsAPI.getTasks).mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useProjectTasks(mockProjectId));
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.error).toBe('Failed to load tasks');
    });
  });

  describe('Task Data', () => {
    it('stores loaded tasks', async () => {
      vi.mocked(projectsAPI.getTasks).mockResolvedValue([mockTask]);
      const { result } = renderHook(() => useProjectTasks(mockProjectId));
      
      await waitFor(() => {
        expect(result.current.tasks.length).toBe(1);
      });
      
      expect(result.current.tasks[0]._id).toBe('task-1');
      expect(result.current.tasks[0].title).toBe('Test Task');
    });

    it('handles multiple tasks', async () => {
      const tasks = [
        { ...mockTask, _id: 'task-1' },
        { ...mockTask, _id: 'task-2' },
        { ...mockTask, _id: 'task-3' },
      ];
      vi.mocked(projectsAPI.getTasks).mockResolvedValue(tasks);
      
      const { result } = renderHook(() => useProjectTasks(mockProjectId));
      
      await waitFor(() => {
        expect(result.current.tasks.length).toBe(3);
      });
      
      expect(result.current.tasks[0]._id).toBe('task-1');
      expect(result.current.tasks[1]._id).toBe('task-2');
      expect(result.current.tasks[2]._id).toBe('task-3');
    });
  });
});
