export type PomodoroMode = "focus" | "break";

export type PomodoroSettings = {
  focusMinutes: number;
  breakMinutes: number;
};

export type PomodoroSessionHistoryItem = {
  id: string;
  mode: PomodoroMode;
  durationMinutes: number;
  completedAt: number;
};

export type PomodoroDailySummary = {
  dateKey: string;
  completedPomodoros: number;
  totalFocusMinutes: number;
  history: PomodoroSessionHistoryItem[];
};

export type PomodoroRuntimeState = {
  mode: PomodoroMode;
  remainingMs: number;
  isRunning: boolean;
};

export type PomodoroPersistedState = {
  version: 1;
  savedAt: number;
  settings: PomodoroSettings;
  runtime: PomodoroRuntimeState;
  daily: PomodoroDailySummary;
};
