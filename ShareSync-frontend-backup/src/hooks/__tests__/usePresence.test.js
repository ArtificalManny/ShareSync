import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePresence, PresenceStatus, PresenceMode, useFocusTimer } from '../usePresence';

// Mock CursorContext
vi.mock('../context/CursorContext', () => ({
  useCursorContext: () => ({
    sendHeartbeat: vi.fn(),
    cursors: [],
    isConnected: true,
  }),
}));

describe('usePresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constants', () => {
    it('exports PresenceStatus constants', () => {
      expect(PresenceStatus.ONLINE).toBe('online');
      expect(PresenceStatus.IDLE).toBe('idle');
      expect(PresenceStatus.FOCUS).toBe('focus');
      expect(PresenceStatus.OFFLINE).toBe('offline');
    });

    it('exports PresenceMode constants', () => {
      expect(PresenceMode.GHOST).toBe('ghost');
      expect(PresenceMode.TEAM).toBe('team');
      expect(PresenceMode.FOCUS).toBe('focus');
    });
  });

  describe('Initial State', () => {
    it('initializes with ONLINE status', () => {
      const { result } = renderHook(() => usePresence({ autoDetectIdle: false, autoSendHeartbeat: false }));
      expect(result.current.status).toBe(PresenceStatus.ONLINE);
      expect(result.current.isOnline).toBe(true);
    });

    it('initializes with TEAM mode', () => {
      const { result } = renderHook(() => usePresence({ autoDetectIdle: false, autoSendHeartbeat: false }));
      expect(result.current.mode).toBe(PresenceMode.TEAM);
    });

    it('provides status boolean flags', () => {
      const { result } = renderHook(() => usePresence({ autoDetectIdle: false, autoSendHeartbeat: false }));
      expect(result.current.isOnline).toBe(true);
      expect(result.current.isIdle).toBe(false);
      expect(result.current.isFocus).toBe(false);
    });
  });

  describe('Mode Management', () => {
    it('enters ghost mode', () => {
      const { result } = renderHook(() => usePresence({ autoDetectIdle: false, autoSendHeartbeat: false }));
      
      act(() => {
        result.current.enterGhostMode();
      });
      
      expect(result.current.mode).toBe(PresenceMode.GHOST);
    });

    it('enters team mode', () => {
      const { result } = renderHook(() => usePresence({ autoDetectIdle: false, autoSendHeartbeat: false }));
      
      act(() => {
        result.current.enterGhostMode();
      });
      
      act(() => {
        result.current.enterTeamMode();
      });
      
      expect(result.current.mode).toBe(PresenceMode.TEAM);
    });

    it('enters focus mode', () => {
      const { result } = renderHook(() => usePresence({ autoDetectIdle: false, autoSendHeartbeat: false }));
      
      act(() => {
        result.current.enterFocusMode();
      });
      
      expect(result.current.mode).toBe(PresenceMode.FOCUS);
      expect(result.current.status).toBe(PresenceStatus.FOCUS);
      expect(result.current.isFocus).toBe(true);
    });

    it('exits focus mode', () => {
      const { result } = renderHook(() => usePresence({ autoDetectIdle: false, autoSendHeartbeat: false }));
      
      act(() => {
        result.current.enterFocusMode();
      });
      
      act(() => {
        result.current.exitFocusMode();
      });
      
      expect(result.current.mode).toBe(PresenceMode.TEAM);
      expect(result.current.status).toBe(PresenceStatus.ONLINE);
    });
  });

  describe('Analytics Functions', () => {
    it('provides project stats function', () => {
      const { result } = renderHook(() => usePresence({ autoDetectIdle: false, autoSendHeartbeat: false }));
      const stats = result.current.projectStats;
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('online');
      expect(stats).toHaveProperty('idle');
      expect(stats).toHaveProperty('focus');
    });

    it('provides getUsersByStatus function', () => {
      const { result } = renderHook(() => usePresence({ autoDetectIdle: false, autoSendHeartbeat: false }));
      expect(typeof result.current.getUsersByStatus).toBe('function');
    });

    it('provides getUsersByMode function', () => {
      const { result } = renderHook(() => usePresence({ autoDetectIdle: false, autoSendHeartbeat: false }));
      expect(typeof result.current.getUsersByMode).toBe('function');
    });

    it('provides isUserActive function', () => {
      const { result } = renderHook(() => usePresence({ autoDetectIdle: false, autoSendHeartbeat: false }));
      expect(typeof result.current.isUserActive).toBe('function');
    });
  });

  describe('Activity Tracking', () => {
    it('provides resetIdleTimer function', () => {
      const { result } = renderHook(() => usePresence({ autoDetectIdle: false, autoSendHeartbeat: false }));
      expect(typeof result.current.resetIdleTimer).toBe('function');
    });

    it('tracks last activity timestamp', () => {
      const { result } = renderHook(() => usePresence({ autoDetectIdle: false, autoSendHeartbeat: false }));
      expect(typeof result.current.lastActivity).toBe('number');
      expect(result.current.lastActivity).toBeGreaterThan(0);
    });

    it('provides time since activity', () => {
      const { result } = renderHook(() => usePresence({ autoDetectIdle: false, autoSendHeartbeat: false }));
      expect(typeof result.current.timeSinceActivity).toBe('number');
      expect(result.current.timeSinceActivity).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('useFocusTimer', () => {
  it('initializes with given duration', () => {
    const { result } = renderHook(() => useFocusTimer(60000)); // 1 minute
    expect(result.current.timeRemaining).toBe(60000);
    expect(result.current.isActive).toBe(false);
  });

  it('provides control functions', () => {
    const { result } = renderHook(() => useFocusTimer(60000));
    expect(typeof result.current.start).toBe('function');
    expect(typeof result.current.pause).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('formats time as MM:SS', () => {
    const { result } = renderHook(() => useFocusTimer(90000)); // 1:30
    expect(result.current.formatted).toBe('1:30');
  });

  it('calculates progress', () => {
    const { result } = renderHook(() => useFocusTimer(60000));
    expect(result.current.progress).toBe(0);
  });

  it('resets to initial duration', () => {
    const { result } = renderHook(() => useFocusTimer(60000));
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.timeRemaining).toBe(60000);
    expect(result.current.isActive).toBe(false);
  });
});
