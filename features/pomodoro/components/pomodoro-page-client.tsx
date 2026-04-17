"use client";

import { useMemo, useState } from "react";

import { usePomodoroTimer } from "../context";
import type { PomodoroMode } from "../types";

type ModeTheme = {
  badgeClassName: string;
  accentClassName: string;
  cardBorderClassName: string;
  cardGlowClassName: string;
  progressColor: string;
  progressTrackColor: string;
  title: string;
  helperCopy: string;
};

const MODE_THEME: Record<PomodoroMode, ModeTheme> = {
  focus: {
    badgeClassName: "border-cyan-400/40 bg-cyan-500/15 text-cyan-200",
    accentClassName: "text-cyan-200",
    cardBorderClassName: "border-cyan-500/25",
    cardGlowClassName: "shadow-[0_0_60px_-28px_rgba(34,211,238,0.5)]",
    progressColor: "rgba(34, 211, 238, 0.95)",
    progressTrackColor: "rgba(30, 41, 59, 0.9)",
    title: "Focus Session",
    helperCopy: "Derin odak zamanı. Telefonu sessize al ve tek göreve bağlan.",
  },
  break: {
    badgeClassName: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
    accentClassName: "text-emerald-200",
    cardBorderClassName: "border-emerald-500/25",
    cardGlowClassName: "shadow-[0_0_60px_-28px_rgba(16,185,129,0.5)]",
    progressColor: "rgba(16, 185, 129, 0.95)",
    progressTrackColor: "rgba(30, 41, 59, 0.9)",
    title: "Break Session",
    helperCopy: "Kısa mola. Ayağa kalk, su iç, ardından yeniden odaklan.",
  },
};

function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatClockTime(timestamp: number): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatDateKey(dateKey: string): string {
  return dateKey.replaceAll("-", ".");
}

function parseDurationInput(rawValue: string): number | null {
  if (!rawValue.trim()) {
    return null;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return parsedValue;
}

export function PomodoroPageClient() {
  const {
    mode,
    currentSessionLabel,
    isRunning,
    remainingMs,
    settings,
    dailySummary,
    completionNotice,
    progress,
    currentDurationMinutes,
    start,
    pause,
    reset,
    setMode,
    updateDurations,
    dismissCompletionNotice,
  } = usePomodoroTimer();

  const [focusInput, setFocusInput] = useState(() => String(settings.focusMinutes));
  const [breakInput, setBreakInput] = useState(() => String(settings.breakMinutes));
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const modeTheme = MODE_THEME[mode];
  const countdown = useMemo(() => formatCountdown(remainingMs), [remainingMs]);
  const progressDegrees = Math.round(progress * 360);
  const progressRingStyle = {
    background: `conic-gradient(${modeTheme.progressColor} ${progressDegrees}deg, ${modeTheme.progressTrackColor} ${progressDegrees}deg 360deg)`,
  };
  const nextMode: PomodoroMode = mode === "focus" ? "break" : "focus";
  const nextModeLabel = nextMode === "focus" ? "Focus" : "Break";

  const handleApplySettings = () => {
    const nextFocusMinutes = parseDurationInput(focusInput);
    const nextBreakMinutes = parseDurationInput(breakInput);

    if (!nextFocusMinutes || !nextBreakMinutes || nextFocusMinutes < 1 || nextBreakMinutes < 1) {
      setSettingsError("Süreler 1 dakikadan büyük olmalı.");
      return;
    }

    updateDurations({
      focusMinutes: nextFocusMinutes,
      breakMinutes: nextBreakMinutes,
    });
    setFocusInput(String(nextFocusMinutes));
    setBreakInput(String(nextBreakMinutes));
    setSettingsError(null);
  };

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 backdrop-blur-sm md:p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pomodoro Workspace</p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-100">Odak bloklarını yönet</h3>
            <p className="mt-1 text-sm text-slate-400">Her seans ölçülebilir olsun: odaklan, mola ver, ritmi koru.</p>
          </div>
          <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium ${modeTheme.badgeClassName}`}>
            {modeTheme.title}
          </span>
        </div>
      </header>

      {completionNotice ? (
        <div className={`rounded-2xl border bg-slate-900/55 p-4 transition-colors ${modeTheme.cardBorderClassName}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={`text-sm font-medium ${modeTheme.accentClassName}`}>
                {completionNotice.completedMode === "focus" ? "Focus tamamlandı" : "Mola tamamlandı"}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Şimdi <span className="font-medium text-slate-100">{completionNotice.nextMode === "focus" ? "Focus" : "Break"}</span> için
                hazırsın.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissCompletionNotice}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
            >
              Kapat
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
        <article
          className={`rounded-3xl border bg-gradient-to-b from-slate-900/70 via-slate-900/55 to-slate-950/80 p-6 transition-colors md:p-8 ${modeTheme.cardBorderClassName} ${modeTheme.cardGlowClassName}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Current Session</p>
              <h4 className="mt-1 text-lg font-semibold text-slate-100">{modeTheme.title}</h4>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs ${modeTheme.badgeClassName}`}>
              {isRunning ? "Running" : "Paused"}
            </span>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center">
            <div className="relative grid h-72 w-72 place-items-center rounded-full p-4 sm:h-80 sm:w-80" style={progressRingStyle}>
              <div className="absolute inset-[14px] rounded-full border border-slate-800/90 bg-slate-950/95" />
              <div className="relative text-center">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{currentSessionLabel}</p>
                <p className="mt-2 font-mono text-6xl font-semibold tracking-tight text-slate-100 sm:text-7xl">{countdown}</p>
                <p className="mt-3 text-xs text-slate-400">
                  Session Length: <span className="font-medium text-slate-200">{currentDurationMinutes} min</span>
                </p>
              </div>
            </div>
            <p className="mt-6 text-center text-sm text-slate-400">{modeTheme.helperCopy}</p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={isRunning ? pause : start}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                isRunning
                  ? "border-amber-400/40 bg-amber-500/10 text-amber-200 hover:border-amber-300/50"
                  : `${modeTheme.badgeClassName} hover:brightness-110`
              }`}
            >
              {isRunning ? "Pause" : "Start"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:text-slate-100"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setMode(nextMode)}
              className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
            >
              Switch to {nextModeLabel}
            </button>
          </div>
        </article>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/35 p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Today</p>
            <h4 className="mt-2 text-base font-semibold text-slate-100">Productivity Summary</h4>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-xs text-slate-500">Completed Pomodoros</p>
                <p className="mt-1 text-2xl font-semibold text-slate-100">{dailySummary.completedPomodoros}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-xs text-slate-500">Focus Minutes</p>
                <p className="mt-1 text-2xl font-semibold text-slate-100">{dailySummary.totalFocusMinutes}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-xs text-slate-500">Current Mode</p>
                <p className={`mt-1 text-lg font-semibold ${modeTheme.accentClassName}`}>{currentSessionLabel}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Date: {formatDateKey(dailySummary.dateKey)}</p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/35 p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Settings</p>
            <h4 className="mt-2 text-base font-semibold text-slate-100">Session Durations</h4>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs text-slate-400">Focus (min)</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={focusInput}
                  onChange={(event) => setFocusInput(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500/60"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs text-slate-400">Break (min)</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={breakInput}
                  onChange={(event) => setBreakInput(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-500/60"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleApplySettings}
                className="rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500"
              >
                Apply Durations
              </button>
              <p className="text-xs text-slate-500">Apply işlemi aktif seansı durdurup süreyi yeniden başlatır.</p>
            </div>

            {settingsError ? <p className="mt-3 text-xs text-rose-300">{settingsError}</p> : null}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/35 p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">History</p>
            <h4 className="mt-2 text-base font-semibold text-slate-100">Today&apos;s Sessions</h4>

            {dailySummary.history.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">Henüz tamamlanan bir seans yok. İlk odak blokunu başlat.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {dailySummary.history.map((item) => {
                  const historyModeTheme = MODE_THEME[item.mode];

                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${historyModeTheme.badgeClassName}`}>
                          {item.mode === "focus" ? "Focus" : "Break"}
                        </span>
                        <span className="text-sm text-slate-300">{item.durationMinutes} min</span>
                      </div>
                      <span className="text-xs text-slate-500">{formatClockTime(item.completedAt)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
