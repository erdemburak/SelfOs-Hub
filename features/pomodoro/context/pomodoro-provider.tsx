"use client";

import { createContext, useContext, type ReactNode } from "react";

import { usePomodoroTimer as usePomodoroTimerState } from "../hooks/use-pomodoro-timer";

type PomodoroTimerContextValue = ReturnType<typeof usePomodoroTimerState>;

const PomodoroTimerContext = createContext<PomodoroTimerContextValue | null>(null);

type PomodoroProviderProps = {
  children: ReactNode;
};

export function PomodoroProvider({ children }: PomodoroProviderProps) {
  const timerState = usePomodoroTimerState();

  return <PomodoroTimerContext.Provider value={timerState}>{children}</PomodoroTimerContext.Provider>;
}

export function usePomodoroTimer() {
  const context = useContext(PomodoroTimerContext);

  if (!context) {
    throw new Error("usePomodoroTimer must be used within PomodoroProvider.");
  }

  return context;
}
