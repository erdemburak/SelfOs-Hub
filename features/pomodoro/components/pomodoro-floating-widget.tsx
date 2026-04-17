"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { usePomodoroTimer } from "../context";

type WidgetPosition = {
  x: number;
  y: number;
};

type WidgetSize = {
  width: number;
  height: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  origin: WidgetPosition;
};

const WIDGET_POSITION_STORAGE_KEY = "selfos.pomodoro.widget.position.v1";
const WIDGET_VIEWPORT_MARGIN = 12;
const FALLBACK_WIDGET_SIZE: WidgetSize = {
  width: 224,
  height: 224,
};
const INTERACTIVE_SELECTOR = "a,button,input,select,textarea,[role='button']";

const MODE_THEME = {
  focus: {
    modeLabelClassName: "border-cyan-400/45 bg-cyan-500/10 text-cyan-100",
    statusDotClassName: "bg-cyan-300",
    progressColor: "rgba(34, 211, 238, 0.95)",
    progressTrackColor: "rgba(30, 41, 59, 0.85)",
    glowClassName: "shadow-[0_20px_55px_-24px_rgba(34,211,238,0.45)]",
  },
  break: {
    modeLabelClassName: "border-emerald-400/45 bg-emerald-500/10 text-emerald-100",
    statusDotClassName: "bg-emerald-300",
    progressColor: "rgba(16, 185, 129, 0.95)",
    progressTrackColor: "rgba(30, 41, 59, 0.85)",
    glowClassName: "shadow-[0_20px_55px_-24px_rgba(16,185,129,0.45)]",
  },
} as const;

function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function clampPosition(position: WidgetPosition, size: WidgetSize, viewportWidth: number, viewportHeight: number): WidgetPosition {
  const maxX = Math.max(WIDGET_VIEWPORT_MARGIN, viewportWidth - size.width - WIDGET_VIEWPORT_MARGIN);
  const maxY = Math.max(WIDGET_VIEWPORT_MARGIN, viewportHeight - size.height - WIDGET_VIEWPORT_MARGIN);

  return {
    x: Math.min(maxX, Math.max(WIDGET_VIEWPORT_MARGIN, Math.round(position.x))),
    y: Math.min(maxY, Math.max(WIDGET_VIEWPORT_MARGIN, Math.round(position.y))),
  };
}

function getWidgetSize(element: HTMLDivElement | null): WidgetSize {
  if (!element) {
    return FALLBACK_WIDGET_SIZE;
  }

  return {
    width: element.offsetWidth || FALLBACK_WIDGET_SIZE.width,
    height: element.offsetHeight || FALLBACK_WIDGET_SIZE.height,
  };
}

function getDefaultPosition(viewportWidth: number, viewportHeight: number, size: WidgetSize): WidgetPosition {
  return clampPosition(
    {
      x: viewportWidth - size.width - WIDGET_VIEWPORT_MARGIN,
      y: viewportHeight - size.height - WIDGET_VIEWPORT_MARGIN,
    },
    size,
    viewportWidth,
    viewportHeight
  );
}

function loadStoredPosition(): WidgetPosition | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(WIDGET_POSITION_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as unknown;

    if (
      typeof parsed !== "object" ||
      !parsed ||
      !("x" in parsed) ||
      !("y" in parsed) ||
      typeof parsed.x !== "number" ||
      typeof parsed.y !== "number"
    ) {
      return null;
    }

    return {
      x: parsed.x,
      y: parsed.y,
    };
  } catch {
    return null;
  }
}

export function PomodoroFloatingWidget() {
  const pathname = usePathname();
  const { sessionActive, mode, isRunning, remainingMs, progress } = usePomodoroTimer();
  const [position, setPosition] = useState<WidgetPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const countdown = useMemo(() => formatCountdown(remainingMs), [remainingMs]);
  const isPomodoroRoute = pathname === "/pomodoro" || pathname.startsWith("/pomodoro/");
  const shouldShow = sessionActive && !isPomodoroRoute;
  const modeLabel = mode === "focus" ? "Focus" : "Break";
  const modeTheme = MODE_THEME[mode];
  const progressDegrees = Math.round(progress * 360);
  const progressRingStyle = useMemo(
    () => ({
      background: `conic-gradient(${modeTheme.progressColor} ${progressDegrees}deg, ${modeTheme.progressTrackColor} ${progressDegrees}deg 360deg)`,
    }),
    [modeTheme.progressColor, modeTheme.progressTrackColor, progressDegrees]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const size = getWidgetSize(widgetRef.current);
    const storedPosition = loadStoredPosition();
    const initialPosition =
      storedPosition ?? getDefaultPosition(window.innerWidth, window.innerHeight, size);

    setPosition(clampPosition(initialPosition, size, window.innerWidth, window.innerHeight));
  }, []);

  useEffect(() => {
    if (!position || typeof window === "undefined") {
      return;
    }

    if (isDragging) {
      return;
    }

    try {
      window.localStorage.setItem(WIDGET_POSITION_STORAGE_KEY, JSON.stringify(position));
    } catch {
      // Ignore localStorage write errors.
    }
  }, [isDragging, position]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      setPosition((currentPosition) => {
        if (!currentPosition) {
          return currentPosition;
        }

        const size = getWidgetSize(widgetRef.current);
        return clampPosition(currentPosition, size, window.innerWidth, window.innerHeight);
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!shouldShow || !position || typeof window === "undefined") {
      return;
    }

    const size = getWidgetSize(widgetRef.current);
    const nextPosition = clampPosition(position, size, window.innerWidth, window.innerHeight);

    if (nextPosition.x === position.x && nextPosition.y === position.y) {
      return;
    }

    setPosition(nextPosition);
  }, [position, shouldShow]);

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !position) {
      return;
    }

    const target = event.target as HTMLElement | null;

    if (target?.closest(INTERACTIVE_SELECTOR)) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: position,
    };
    setIsDragging(true);
  };

  const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId || typeof window === "undefined") {
      return;
    }

    event.preventDefault();
    const size = getWidgetSize(widgetRef.current);
    const nextPosition = clampPosition(
      {
        x: dragState.origin.x + (event.clientX - dragState.startX),
        y: dragState.origin.y + (event.clientY - dragState.startY),
      },
      size,
      window.innerWidth,
      window.innerHeight
    );

    setPosition(nextPosition);
  };

  const handleDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (!shouldShow || !position) {
    return null;
  }

  return (
    <div
      ref={widgetRef}
      className={`fixed z-[110] h-52 w-52 touch-none select-none rounded-full text-slate-100 backdrop-blur sm:h-56 sm:w-56 ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      } ${modeTheme.glowClassName}`}
      style={{ left: position.x, top: position.y }}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
      onLostPointerCapture={handleDragEnd}
    >
      <div className="absolute inset-0 rounded-full border border-slate-700/70" style={progressRingStyle} />
      <div className="absolute inset-[12px] rounded-full border border-slate-700/75 bg-slate-950/95 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.6)]" />

      <div className="relative z-10 flex h-full flex-col items-center justify-between p-4 sm:p-5">
        <div className="flex w-full items-center justify-between">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${modeTheme.modeLabelClassName}`}>
            {modeLabel}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
              isRunning
                ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
                : "border-amber-400/35 bg-amber-500/10 text-amber-100"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? modeTheme.statusDotClassName : "bg-amber-300"}`} />
            {isRunning ? "Running" : "Paused"}
          </span>
        </div>

        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Remaining</p>
          <p className="mt-1 font-mono text-4xl font-semibold tracking-tight text-slate-100 sm:text-[2.6rem]">{countdown}</p>
        </div>

        <Link
          href="/pomodoro"
          className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-200 transition hover:border-slate-600 hover:text-slate-100"
        >
          Back to Pomodoro
        </Link>
      </div>
    </div>
  );
}
