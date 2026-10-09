import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PomodoroMode,
  PomodoroSettings,
  MODE_LABELS,
  clampSettings,
  durationSeconds,
  formatTime,
  getNextMode,
} from './pomodoro';
import { getStoredPomodoroSettings, saveStoredPomodoroSettings } from './storage';

export type PomodoroStatus = 'idle' | 'running' | 'paused';

export interface PomodoroToast {
  id: number;
  message: string;
}

export interface PomodoroState {
  mode: PomodoroMode;
  status: PomodoroStatus;
  remainingSec: number;
  completedFocus: number;
  settings: PomodoroSettings;
}

const COMPLETION_MESSAGES: Record<PomodoroMode, string> = {
  focus: 'Focus session complete.',
  short: 'Short break over.',
  long: 'Long break over.',
};

function beep() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // audio unavailable
  }
}

export function usePomodoro() {
  const [state, setState] = useState<PomodoroState>(() => {
    const settings = getStoredPomodoroSettings();
    return {
      mode: 'focus',
      status: 'idle',
      remainingSec: durationSeconds('focus', settings),
      completedFocus: 0,
      settings,
    };
  });
  const [toast, setToast] = useState<PomodoroToast | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const endAtRef = useRef<number | null>(null);
  const originalTitleRef = useRef<string | null>(null);
  const stateRef = useRef(state);

  const commit = useCallback((next: PomodoroState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  // Keep the ref in sync with renders from any source.
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied' as NotificationPermission;
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      return perm;
    } catch {
      return Notification.permission;
    }
  }, []);

  const notifyComplete = useCallback((finishedMode: PomodoroMode, nextMode: PomodoroMode) => {
    const message = `${COMPLETION_MESSAGES[finishedMode]} ${
      nextMode === 'focus' ? 'Time to focus.' : `Time for a ${MODE_LABELS[nextMode].toLowerCase()}.`
    }`;
    setToast({ id: Date.now(), message });
    beep();
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', { body: message });
      }
    } catch {
      // notifications unavailable
    }
  }, []);

  // 250ms tick while running; remaining is derived from an end timestamp so
  // the timer stays accurate in background tabs.
  useEffect(() => {
    if (state.status !== 'running') return;
    const tick = () => {
      const endAt = endAtRef.current;
      if (endAt == null) return;
      const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      const cur = stateRef.current;
      if (remaining <= 0) {
        endAtRef.current = null;
        const next = getNextMode(cur.mode, cur.completedFocus, cur.settings);
        notifyComplete(cur.mode, next.mode);
        commit({
          ...cur,
          mode: next.mode,
          status: 'idle',
          completedFocus: next.completedFocus,
          remainingSec: durationSeconds(next.mode, cur.settings),
        });
        return;
      }
      if (cur.remainingSec !== remaining) commit({ ...cur, remainingSec: remaining });
    };
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [state.status, notifyComplete, commit]);

  // Keep document.title in sync while running.
  useEffect(() => {
    if (state.status === 'running') {
      if (originalTitleRef.current === null) originalTitleRef.current = document.title;
      document.title = `${formatTime(state.remainingSec)} ${MODE_LABELS[state.mode]} | StudyFlow`;
    } else if (originalTitleRef.current !== null) {
      document.title = originalTitleRef.current;
      originalTitleRef.current = null;
    }
  }, [state.status, state.remainingSec, state.mode]);

  useEffect(
    () => () => {
      if (originalTitleRef.current !== null) document.title = originalTitleRef.current;
    },
    []
  );

  const start = useCallback(() => {
    const cur = stateRef.current;
    if (cur.status === 'running') return;
    endAtRef.current = Date.now() + cur.remainingSec * 1000;
    commit({ ...cur, status: 'running' });
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      requestNotificationPermission();
    }
  }, [requestNotificationPermission, commit]);

  const pause = useCallback(() => {
    const cur = stateRef.current;
    if (cur.status !== 'running') return;
    const endAt = endAtRef.current;
    const remaining = endAt == null ? cur.remainingSec : Math.max(0, Math.round((endAt - Date.now()) / 1000));
    endAtRef.current = null;
    commit({ ...cur, status: 'paused', remainingSec: remaining });
  }, [commit]);

  const resume = useCallback(() => {
    const cur = stateRef.current;
    if (cur.status !== 'paused') return;
    endAtRef.current = Date.now() + cur.remainingSec * 1000;
    commit({ ...cur, status: 'running' });
  }, [commit]);

  const reset = useCallback(() => {
    endAtRef.current = null;
    setState((prev) => ({
      ...prev,
      status: 'idle',
      remainingSec: durationSeconds(prev.mode, prev.settings),
    }));
  }, []);

  const skip = useCallback(() => {
    endAtRef.current = null;
    setState((prev) => {
      const next = getNextMode(prev.mode, prev.completedFocus, prev.settings);
      return {
        ...prev,
        mode: next.mode,
        status: 'idle',
        completedFocus: next.completedFocus,
        remainingSec: durationSeconds(next.mode, prev.settings),
      };
    });
  }, []);

  const switchMode = useCallback((mode: PomodoroMode) => {
    endAtRef.current = null;
    setState((prev) => ({
      ...prev,
      mode,
      status: 'idle',
      remainingSec: durationSeconds(mode, prev.settings),
    }));
  }, []);

  const updateSettings = useCallback((partial: Partial<PomodoroSettings>) => {
    const cur = stateRef.current;
    const settings = clampSettings({ ...cur.settings, ...partial });
    saveStoredPomodoroSettings(settings);
    commit({
      ...cur,
      settings,
      remainingSec:
        cur.status === 'idle' ? durationSeconds(cur.mode, settings) : cur.remainingSec,
    });
  }, [commit]);

  const dismissToast = useCallback(() => setToast(null), []);

  return {
    ...state,
    toast,
    notificationPermission,
    start,
    pause,
    resume,
    reset,
    skip,
    switchMode,
    updateSettings,
    requestNotificationPermission,
    dismissToast,
  };
}
