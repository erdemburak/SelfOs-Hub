"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  POMODORO_HISTORY_LIMIT,
  createEmptyDailySummary,
  createPomodoroSettings,
  getDateKeyFromTimestamp,
  getModeDurationMs,
  loadPomodoroState,
  savePomodoroState,
} from "../lib";
import type { PomodoroDailySummary, PomodoroMode, PomodoroPersistedState, PomodoroSettings } from "../types";

type CompletionNotice = {
  id: string;
  completedMode: PomodoroMode;
  nextMode: PomodoroMode;
  completedAt: number;
};

type PomodoroState = {
  settings: PomodoroSettings;
  mode: PomodoroMode;
  remainingMs: number;
  isRunning: boolean;
  sessionActive: boolean;
  daily: PomodoroDailySummary;
  completionNotice: CompletionNotice | null;
};

type RunningAnchor = {
  startedAt: number;
  startRemainingMs: number;
};

const TIMER_TICK_MS = 250;
const DAY_SYNC_MS = 60_000;

function createHistoryId(timestamp: number): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `pomodoro-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureDailySummaryForTimestamp(summary: PomodoroDailySummary, timestamp: number): PomodoroDailySummary {
  const expectedDateKey = getDateKeyFromTimestamp(timestamp);

  if (summary.dateKey === expectedDateKey) {
    return summary;
  }

  return createEmptyDailySummary(expectedDateKey);
}

function clampMsToModeDuration(remainingMs: number, mode: PomodoroMode, settings: PomodoroSettings): number {
  const fullDurationMs = getModeDurationMs(mode, settings);
  return Math.min(fullDurationMs, Math.max(0, Math.round(remainingMs)));
}

function completeSessionFromState(currentState: PomodoroState, completedMode: PomodoroMode, completedAt: number): PomodoroState {
  const durationMinutes = completedMode === "focus" ? currentState.settings.focusMinutes : currentState.settings.breakMinutes;
  const nextMode: PomodoroMode = completedMode === "focus" ? "break" : "focus";
  const syncedDailySummary = ensureDailySummaryForTimestamp(currentState.daily, completedAt);
  const nextHistory = [
    {
      id: createHistoryId(completedAt),
      mode: completedMode,
      durationMinutes,
      completedAt,
    },
    ...syncedDailySummary.history,
  ].slice(0, POMODORO_HISTORY_LIMIT);

  return {
    ...currentState,
    mode: nextMode,
    remainingMs: getModeDurationMs(nextMode, currentState.settings),
    isRunning: false,
    sessionActive: false,
    daily: {
      dateKey: syncedDailySummary.dateKey,
      completedPomodoros:
        completedMode === "focus" ? syncedDailySummary.completedPomodoros + 1 : syncedDailySummary.completedPomodoros,
      totalFocusMinutes:
        completedMode === "focus"
          ? syncedDailySummary.totalFocusMinutes + durationMinutes
          : syncedDailySummary.totalFocusMinutes,
      history: nextHistory,
    },
    completionNotice: {
      id: createHistoryId(completedAt + 1),
      completedMode,
      nextMode,
      completedAt,
    },
  };
}

function createInitialHookState(now: number = Date.now()): PomodoroState {
  const persistedState = loadPomodoroState(now);
  const syncedDailySummary = ensureDailySummaryForTimestamp(persistedState.daily, now);
  const settings = createPomodoroSettings(persistedState.settings);
  const mode = persistedState.runtime.mode;
  const remainingMs = clampMsToModeDuration(persistedState.runtime.remainingMs, mode, settings);
  const elapsedSinceSave = Math.max(0, now - persistedState.savedAt);

  const baseState: PomodoroState = {
    settings,
    mode,
    remainingMs,
    isRunning: persistedState.runtime.isRunning,
    sessionActive: persistedState.runtime.sessionActive,
    daily: syncedDailySummary,
    completionNotice: null,
  };

  if (!persistedState.runtime.isRunning) {
    return baseState;
  }

  const resumedRemainingMs = Math.max(0, remainingMs - elapsedSinceSave);

  if (resumedRemainingMs > 0) {
    return {
      ...baseState,
      remainingMs: resumedRemainingMs,
      isRunning: true,
    };
  }

  return completeSessionFromState(
    {
      ...baseState,
      remainingMs: 0,
      isRunning: false,
    },
    mode,
    now
  );
}

function createPersistedState(state: PomodoroState, timestamp: number): PomodoroPersistedState {
  return {
    version: 1,
    savedAt: timestamp,
    settings: state.settings,
    runtime: {
      mode: state.mode,
      remainingMs: state.remainingMs,
      isRunning: state.isRunning,
      sessionActive: state.sessionActive,
    },
    daily: ensureDailySummaryForTimestamp(state.daily, timestamp),
  };
}

export function usePomodoroTimer() {
  const [state, setState] = useState<PomodoroState>(() => createInitialHookState());
  const intervalRef = useRef<number | null>(null);
  const runningAnchorRef = useRef<RunningAnchor | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearRunningAnchor = useCallback(() => {
    runningAnchorRef.current = null;
  }, []);

  const getRemainingFromAnchor = useCallback(
    (fallbackMs: number, timestamp: number): number => {
      const anchor = runningAnchorRef.current;

      if (!anchor) {
        return fallbackMs;
      }

      return Math.max(0, Math.round(anchor.startRemainingMs - (timestamp - anchor.startedAt)));
    },
    []
  );

  const completeCurrentSession = useCallback(
    (completedAt: number) => {
      clearTimerInterval();
      clearRunningAnchor();

      setState((currentState) => completeSessionFromState(currentState, currentState.mode, completedAt));
    },
    [clearRunningAnchor, clearTimerInterval]
  );

  const pause = useCallback(() => {
    clearTimerInterval();

    const pausedAt = Date.now();
    const remainingMsAtPause = getRemainingFromAnchor(stateRef.current.remainingMs, pausedAt);

    clearRunningAnchor();

    setState((currentState) => ({
      ...currentState,
      remainingMs: clampMsToModeDuration(
        remainingMsAtPause,
        currentState.mode,
        currentState.settings
      ),
      isRunning: false,
      sessionActive: currentState.sessionActive,
      daily: ensureDailySummaryForTimestamp(currentState.daily, pausedAt),
    }));
  }, [clearRunningAnchor, clearTimerInterval, getRemainingFromAnchor]);

  const start = useCallback(() => {
    setState((currentState) => {
      if (currentState.isRunning) {
        return currentState;
      }

      const now = Date.now();
      const nextRemainingMs =
        currentState.remainingMs > 0
          ? currentState.remainingMs
          : getModeDurationMs(currentState.mode, currentState.settings);

      return {
        ...currentState,
        remainingMs: nextRemainingMs,
        isRunning: true,
        sessionActive: true,
        daily: ensureDailySummaryForTimestamp(currentState.daily, now),
        completionNotice: null,
      };
    });
  }, []);

  const reset = useCallback(() => {
    clearTimerInterval();
    clearRunningAnchor();

    setState((currentState) => {
      const now = Date.now();

      return {
        ...currentState,
        remainingMs: getModeDurationMs(currentState.mode, currentState.settings),
        isRunning: false,
        sessionActive: false,
        daily: ensureDailySummaryForTimestamp(currentState.daily, now),
        completionNotice: null,
      };
    });
  }, [clearRunningAnchor, clearTimerInterval]);

  const setMode = useCallback(
    (mode: PomodoroMode) => {
      clearTimerInterval();
      clearRunningAnchor();

      setState((currentState) => {
        if (currentState.mode === mode && !currentState.isRunning) {
          return currentState;
        }

        const now = Date.now();

        return {
          ...currentState,
          mode,
          remainingMs: getModeDurationMs(mode, currentState.settings),
          isRunning: false,
          sessionActive: false,
          daily: ensureDailySummaryForTimestamp(currentState.daily, now),
          completionNotice: null,
        };
      });
    },
    [clearRunningAnchor, clearTimerInterval]
  );

  const updateDurations = useCallback(
    (nextSettings: Partial<PomodoroSettings>) => {
      clearTimerInterval();
      clearRunningAnchor();

      setState((currentState) => {
        const now = Date.now();
        const mergedSettings = createPomodoroSettings({
          focusMinutes: nextSettings.focusMinutes ?? currentState.settings.focusMinutes,
          breakMinutes: nextSettings.breakMinutes ?? currentState.settings.breakMinutes,
        });

        return {
          ...currentState,
          settings: mergedSettings,
          remainingMs: getModeDurationMs(currentState.mode, mergedSettings),
          isRunning: false,
          sessionActive: false,
          daily: ensureDailySummaryForTimestamp(currentState.daily, now),
          completionNotice: null,
        };
      });
    },
    [clearRunningAnchor, clearTimerInterval]
  );

  const dismissCompletionNotice = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      completionNotice: null,
    }));
  }, []);

  useEffect(() => {
    if (!state.isRunning) {
      clearTimerInterval();
      clearRunningAnchor();
      return;
    }

    const now = Date.now();
    const startRemainingMs = stateRef.current.remainingMs;
    runningAnchorRef.current = {
      startedAt: now,
      startRemainingMs,
    };

    const tick = () => {
      const tickTime = Date.now();
      const nextRemainingMs = getRemainingFromAnchor(stateRef.current.remainingMs, tickTime);

      if (nextRemainingMs <= 0) {
        completeCurrentSession(tickTime);
        return;
      }

      setState((currentState) => {
        const syncedDailySummary = ensureDailySummaryForTimestamp(currentState.daily, tickTime);
        const nextRemaining = clampMsToModeDuration(nextRemainingMs, currentState.mode, currentState.settings);

        if (nextRemaining === currentState.remainingMs && syncedDailySummary === currentState.daily) {
          return currentState;
        }

        return {
          ...currentState,
          remainingMs: nextRemaining,
          daily: syncedDailySummary,
        };
      });
    };

    tick();
    intervalRef.current = window.setInterval(tick, TIMER_TICK_MS);

    return () => {
      clearTimerInterval();
    };
  }, [
    clearRunningAnchor,
    clearTimerInterval,
    completeCurrentSession,
    getRemainingFromAnchor,
    state.isRunning,
  ]);

  useEffect(() => {
    const daySyncIntervalId = window.setInterval(() => {
      const now = Date.now();

      setState((currentState) => {
        const syncedDailySummary = ensureDailySummaryForTimestamp(currentState.daily, now);

        if (syncedDailySummary === currentState.daily) {
          return currentState;
        }

        return {
          ...currentState,
          daily: syncedDailySummary,
        };
      });
    }, DAY_SYNC_MS);

    return () => {
      window.clearInterval(daySyncIntervalId);
    };
  }, []);

  useEffect(() => {
    savePomodoroState(createPersistedState(state, Date.now()));
  }, [state]);

  const progress = useMemo(() => {
    const fullDurationMs = getModeDurationMs(state.mode, state.settings);

    if (fullDurationMs <= 0) {
      return 0;
    }

    const ratio = (fullDurationMs - state.remainingMs) / fullDurationMs;
    return Math.min(1, Math.max(0, ratio));
  }, [state.mode, state.remainingMs, state.settings]);

  const currentDurationMinutes = state.mode === "focus" ? state.settings.focusMinutes : state.settings.breakMinutes;
  const currentSessionLabel = state.mode === "focus" ? "Focus" : "Break";

  return {
    mode: state.mode,
    currentSessionLabel,
    isRunning: state.isRunning,
    sessionActive: state.sessionActive,
    remainingMs: state.remainingMs,
    settings: state.settings,
    dailySummary: state.daily,
    completionNotice: state.completionNotice,
    progress,
    currentDurationMinutes,
    start,
    pause,
    reset,
    setMode,
    updateDurations,
    dismissCompletionNotice,
  };
}
