import type {
  PomodoroDailySummary,
  PomodoroMode,
  PomodoroPersistedState,
  PomodoroRuntimeState,
  PomodoroSessionHistoryItem,
  PomodoroSettings,
} from "../types";

export const POMODORO_STORAGE_KEY = "selfos.pomodoro.state.v1";
export const POMODORO_HISTORY_LIMIT = 24;
const STORAGE_VERSION = 1 as const;
const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;
const MIN_DURATION_MINUTES = 1;
const MAX_DURATION_MINUTES = 180;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clampDurationMinutes(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const roundedValue = Math.round(value);
  return Math.min(MAX_DURATION_MINUTES, Math.max(MIN_DURATION_MINUTES, roundedValue));
}

function isPomodoroMode(value: unknown): value is PomodoroMode {
  return value === "focus" || value === "break";
}

export function getDateKeyFromTimestamp(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getModeDurationMs(mode: PomodoroMode, settings: PomodoroSettings): number {
  const minutes = mode === "focus" ? settings.focusMinutes : settings.breakMinutes;
  return minutes * 60 * 1000;
}

export function createPomodoroSettings(settings?: Partial<PomodoroSettings>): PomodoroSettings {
  return {
    focusMinutes: clampDurationMinutes(settings?.focusMinutes ?? DEFAULT_FOCUS_MINUTES, DEFAULT_FOCUS_MINUTES),
    breakMinutes: clampDurationMinutes(settings?.breakMinutes ?? DEFAULT_BREAK_MINUTES, DEFAULT_BREAK_MINUTES),
  };
}

export function createEmptyDailySummary(dateKey: string = getDateKeyFromTimestamp()): PomodoroDailySummary {
  return {
    dateKey,
    completedPomodoros: 0,
    totalFocusMinutes: 0,
    history: [],
  };
}

export function createInitialPomodoroState(now: number = Date.now()): PomodoroPersistedState {
  const settings = createPomodoroSettings();
  const mode: PomodoroMode = "focus";

  return {
    version: STORAGE_VERSION,
    savedAt: now,
    settings,
    runtime: {
      mode,
      remainingMs: getModeDurationMs(mode, settings),
      isRunning: false,
    },
    daily: createEmptyDailySummary(getDateKeyFromTimestamp(now)),
  };
}

function normalizeSettings(rawValue: unknown): PomodoroSettings {
  if (!isRecord(rawValue)) {
    return createPomodoroSettings();
  }

  return createPomodoroSettings({
    focusMinutes: typeof rawValue.focusMinutes === "number" ? rawValue.focusMinutes : DEFAULT_FOCUS_MINUTES,
    breakMinutes: typeof rawValue.breakMinutes === "number" ? rawValue.breakMinutes : DEFAULT_BREAK_MINUTES,
  });
}

function normalizeHistoryItem(rawValue: unknown): PomodoroSessionHistoryItem | null {
  if (!isRecord(rawValue)) {
    return null;
  }

  const id = typeof rawValue.id === "string" ? rawValue.id : "";
  const durationMinutes = typeof rawValue.durationMinutes === "number" ? Math.max(1, Math.round(rawValue.durationMinutes)) : 0;
  const completedAt = typeof rawValue.completedAt === "number" ? rawValue.completedAt : Number.NaN;
  const mode = isPomodoroMode(rawValue.mode) ? rawValue.mode : null;

  if (!id || !mode || !Number.isFinite(completedAt) || durationMinutes <= 0) {
    return null;
  }

  return {
    id,
    mode,
    durationMinutes,
    completedAt,
  };
}

function normalizeDailySummary(rawValue: unknown, now: number): PomodoroDailySummary {
  const defaultSummary = createEmptyDailySummary(getDateKeyFromTimestamp(now));

  if (!isRecord(rawValue)) {
    return defaultSummary;
  }

  const candidateDateKey = typeof rawValue.dateKey === "string" ? rawValue.dateKey : defaultSummary.dateKey;
  const completedPomodoros =
    typeof rawValue.completedPomodoros === "number" && Number.isFinite(rawValue.completedPomodoros)
      ? Math.max(0, Math.round(rawValue.completedPomodoros))
      : 0;
  const totalFocusMinutes =
    typeof rawValue.totalFocusMinutes === "number" && Number.isFinite(rawValue.totalFocusMinutes)
      ? Math.max(0, Math.round(rawValue.totalFocusMinutes))
      : 0;
  const history = Array.isArray(rawValue.history)
    ? rawValue.history
        .map((item) => normalizeHistoryItem(item))
        .filter((item): item is PomodoroSessionHistoryItem => item !== null)
        .sort((firstItem, secondItem) => secondItem.completedAt - firstItem.completedAt)
        .slice(0, POMODORO_HISTORY_LIMIT)
    : [];

  if (candidateDateKey !== defaultSummary.dateKey) {
    return defaultSummary;
  }

  return {
    dateKey: candidateDateKey,
    completedPomodoros,
    totalFocusMinutes,
    history,
  };
}

function normalizeRuntime(rawValue: unknown, settings: PomodoroSettings): PomodoroRuntimeState {
  const defaultMode: PomodoroMode = "focus";
  const fallbackRemainingMs = getModeDurationMs(defaultMode, settings);

  if (!isRecord(rawValue)) {
    return {
      mode: defaultMode,
      remainingMs: fallbackRemainingMs,
      isRunning: false,
    };
  }

  const mode = isPomodoroMode(rawValue.mode) ? rawValue.mode : defaultMode;
  const fullDurationMs = getModeDurationMs(mode, settings);
  const remainingMs =
    typeof rawValue.remainingMs === "number" && Number.isFinite(rawValue.remainingMs)
      ? Math.min(fullDurationMs, Math.max(0, Math.round(rawValue.remainingMs)))
      : fullDurationMs;

  return {
    mode,
    remainingMs,
    isRunning: rawValue.isRunning === true,
  };
}

export function loadPomodoroState(now: number = Date.now()): PomodoroPersistedState {
  if (typeof window === "undefined") {
    return createInitialPomodoroState(now);
  }

  try {
    const storedValue = window.localStorage.getItem(POMODORO_STORAGE_KEY);

    if (!storedValue) {
      return createInitialPomodoroState(now);
    }

    const parsedValue = JSON.parse(storedValue) as unknown;

    if (!isRecord(parsedValue)) {
      return createInitialPomodoroState(now);
    }

    const settings = normalizeSettings(parsedValue.settings);
    const runtime = normalizeRuntime(parsedValue.runtime, settings);
    const daily = normalizeDailySummary(parsedValue.daily, now);
    const savedAt = typeof parsedValue.savedAt === "number" && Number.isFinite(parsedValue.savedAt) ? parsedValue.savedAt : now;

    return {
      version: STORAGE_VERSION,
      savedAt,
      settings,
      runtime,
      daily,
    };
  } catch {
    return createInitialPomodoroState(now);
  }
}

export function savePomodoroState(state: PomodoroPersistedState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write failures (e.g. private mode quota).
  }
}
