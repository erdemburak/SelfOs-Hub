"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { TodoOutcomeMap } from "../types";

const DAYS_PER_WEEK = 7;
const WEEKS_TO_SHOW = 18;
const TOTAL_CELLS = DAYS_PER_WEEK * WEEKS_TO_SHOW;
const GRID_CELL_SIZE_PX = 11;
const GRID_GAP_PX = 4;
const WEEKDAY_LABEL_COLUMN_WIDTH_PX = 28;
const LABEL_TO_GRID_GAP_PX = 8;
const GRID_BOX_PADDING_PX = 6;
const GRID_BOX_BORDER_PX = 1;
const GRID_BOX_INSET_PX = GRID_BOX_PADDING_PX + GRID_BOX_BORDER_PX;
const MONTH_LABEL_ROW_HEIGHT_PX = 16;
const HEADER_BODY_GAP_PX = 4;

type DailyScore = {
  completedCount: number;
  failedCount: number;
};

type CalendarCell = {
  key: string;
  timestamp: number;
  score: number;
  completedCount: number;
  failedCount: number;
  isFuture: boolean;
  dayOfWeek: number;
};

type TodoPerformanceCalendarProps = {
  outcomes: TodoOutcomeMap;
};

type TooltipState = {
  cell: CalendarCell;
  anchorEl: HTMLButtonElement;
};

type TooltipPosition = {
  top: number;
  left: number;
};

type MonthLabel = {
  key: string;
  label: string;
  weekIndex: number;
};

const DAY_LABEL_BY_ROW: Partial<Record<number, string>> = {
  0: "Pzt",
  2: "Çrş",
  4: "Cum",
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getMondayStart(date: Date): Date {
  const weekDay = date.getDay();
  const diffToMonday = (weekDay + 6) % 7;
  return addDays(startOfDay(date), -diffToMonday);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSignedScore(score: number): string {
  if (score > 0) {
    return `+${score}`;
  }

  return String(score);
}

function getCellColorClass(score: number, hasActivity: boolean, isFuture: boolean): string {
  if (isFuture) {
    return "border-slate-800/40 bg-slate-950/45";
  }

  if (score >= 4) {
    return "border-emerald-500/35 bg-emerald-800/55";
  }

  if (score === 3) {
    return "border-emerald-500/35 bg-emerald-700/45";
  }

  if (score === 2) {
    return "border-emerald-500/30 bg-emerald-600/34";
  }

  if (score === 1) {
    return "border-emerald-500/25 bg-emerald-500/22";
  }

  if (score <= -4) {
    return "border-rose-500/35 bg-rose-800/55";
  }

  if (score === -3) {
    return "border-rose-500/35 bg-rose-700/45";
  }

  if (score === -2) {
    return "border-rose-500/30 bg-rose-600/34";
  }

  if (score === -1) {
    return "border-rose-500/25 bg-rose-500/22";
  }

  if (hasActivity) {
    return "border-slate-600/45 bg-slate-700/30";
  }

  return "border-slate-800/65 bg-slate-900/65";
}

function getScoreTone(score: number): "positive" | "negative" | "neutral" {
  if (score > 0) {
    return "positive";
  }

  if (score < 0) {
    return "negative";
  }

  return "neutral";
}

export function TodoPerformanceCalendar({ outcomes }: TodoPerformanceCalendarProps) {
  const tooltipPanelId = useId();
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("tr-TR", {
        month: "short",
      }),
    []
  );
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );

  const { cells, dailyNetScore, monthLabelByWeek } = useMemo(() => {
    const today = startOfDay(new Date());
    const todayDateKey = toDateKey(today);
    const currentWeekStart = getMondayStart(today);
    const firstDay = addDays(currentWeekStart, -(WEEKS_TO_SHOW - 1) * DAYS_PER_WEEK);
    const todayTimestamp = today.getTime();

    const dailyScores = new Map<string, DailyScore>();
    const firstWeekByMonth = new Map<string, number>();

    for (const outcome of Object.values(outcomes)) {
      const eventAt =
        typeof outcome.completedAt === "number"
          ? outcome.completedAt
          : typeof outcome.failedAt === "number"
            ? outcome.failedAt
            : null;

      if (eventAt === null) {
        continue;
      }

      const eventDate = startOfDay(new Date(eventAt));
      const eventDateKey = toDateKey(eventDate);
      const existingDailyScore = dailyScores.get(eventDateKey) ?? { completedCount: 0, failedCount: 0 };

      if (typeof outcome.completedAt === "number") {
        existingDailyScore.completedCount += 1;
      } else {
        existingDailyScore.failedCount += 1;
      }

      dailyScores.set(eventDateKey, existingDailyScore);
    }

    const todayDailyScore = dailyScores.get(todayDateKey) ?? { completedCount: 0, failedCount: 0 };
    const nextCells: CalendarCell[] = [];
    for (let dayIndex = 0; dayIndex < TOTAL_CELLS; dayIndex += 1) {
      const currentDate = addDays(firstDay, dayIndex);
      const timestamp = currentDate.getTime();
      const key = toDateKey(currentDate);
      const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
      if (!firstWeekByMonth.has(monthKey)) {
        firstWeekByMonth.set(monthKey, Math.floor(dayIndex / DAYS_PER_WEEK));
      }
      const dailyScore = dailyScores.get(key) ?? { completedCount: 0, failedCount: 0 };
      const score = dailyScore.completedCount - dailyScore.failedCount;
      const isFuture = timestamp > todayTimestamp;

      nextCells.push({
        key,
        timestamp,
        score: isFuture ? 0 : score,
        completedCount: isFuture ? 0 : dailyScore.completedCount,
        failedCount: isFuture ? 0 : dailyScore.failedCount,
        isFuture,
        dayOfWeek: dayIndex % DAYS_PER_WEEK,
      });
    }

    const nextMonthLabels: MonthLabel[] = Array.from(firstWeekByMonth.entries()).map(([monthKey, weekIndex]) => {
      const [yearValue, monthValue] = monthKey.split("-").map((value) => Number(value));
      const monthLabel = monthFormatter.format(new Date(yearValue, monthValue, 1)).replace(".", "");

      return {
        key: monthKey,
        label: monthLabel,
        weekIndex,
      };
    });
    const nextMonthLabelByWeek = new Map<number, string>();
    for (const monthLabel of nextMonthLabels) {
      nextMonthLabelByWeek.set(monthLabel.weekIndex, monthLabel.label);
    }

    return {
      cells: nextCells,
      dailyNetScore: todayDailyScore.completedCount - todayDailyScore.failedCount,
      monthLabelByWeek: nextMonthLabelByWeek,
    };
  }, [monthFormatter, outcomes]);

  const activeCell = tooltipState?.cell ?? null;
  const activeScoreTone = activeCell ? getScoreTone(activeCell.score) : "neutral";
  const activeScoreClass =
    activeScoreTone === "positive"
      ? "text-emerald-300"
      : activeScoreTone === "negative"
        ? "text-rose-300"
        : "text-slate-300";
  const panelToneClass =
    activeScoreTone === "positive"
      ? "border-emerald-500/35 bg-emerald-950/40"
      : activeScoreTone === "negative"
        ? "border-rose-500/35 bg-rose-950/40"
        : "border-slate-700/90 bg-slate-950/70";
  const activeDateLabel = activeCell ? formatter.format(new Date(activeCell.timestamp)) : "Bir gün seç";
  const activeScoreLabel = activeCell ? formatSignedScore(activeCell.score) : "0";
  const activeCompletedCount = activeCell?.completedCount ?? 0;
  const activeFailedCount = activeCell?.failedCount ?? 0;

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const openTooltip = useCallback(
    (cell: CalendarCell, anchorEl: HTMLButtonElement) => {
      clearCloseTimeout();
      setTooltipPosition(null);
      setTooltipState({
        cell,
        anchorEl,
      });
    },
    [clearCloseTimeout]
  );

  const scheduleCloseTooltip = useCallback(
    (anchorEl: HTMLButtonElement) => {
      clearCloseTimeout();
      closeTimeoutRef.current = window.setTimeout(() => {
        setTooltipState((currentState) => {
          if (!currentState) {
            return null;
          }

          return currentState.anchorEl === anchorEl ? null : currentState;
        });
        closeTimeoutRef.current = null;
      }, 60);
    },
    [clearCloseTimeout]
  );

  useLayoutEffect(() => {
    if (!tooltipState) {
      return;
    }

    if (!tooltipRef.current) {
      return;
    }

    const computePosition = () => {
      if (!tooltipRef.current) {
        return;
      }

      const anchorRect = tooltipState.anchorEl.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportPadding = 8;
      const offset = 10;
      const spaceAbove = anchorRect.top - viewportPadding;
      const spaceBelow = window.innerHeight - anchorRect.bottom - viewportPadding;
      const spaceLeft = anchorRect.left - viewportPadding;
      const spaceRight = window.innerWidth - anchorRect.right - viewportPadding;

      let placement: "top" | "bottom" | "left" | "right" = "top";
      if (spaceAbove >= tooltipRect.height + offset) {
        placement = "top";
      } else if (spaceBelow >= tooltipRect.height + offset) {
        placement = "bottom";
      } else if (spaceRight >= tooltipRect.width + offset) {
        placement = "right";
      } else if (spaceLeft >= tooltipRect.width + offset) {
        placement = "left";
      } else {
        placement = spaceBelow >= spaceAbove ? "bottom" : "top";
      }

      let top = anchorRect.top - tooltipRect.height - offset;
      let left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;

      if (placement === "bottom") {
        top = anchorRect.bottom + offset;
      } else if (placement === "right") {
        top = anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2;
        left = anchorRect.right + offset;
      } else if (placement === "left") {
        top = anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2;
        left = anchorRect.left - tooltipRect.width - offset;
      }

      if (top + tooltipRect.height > window.innerHeight - viewportPadding) {
        top = Math.max(viewportPadding, window.innerHeight - viewportPadding - tooltipRect.height);
      }
      if (top < viewportPadding) {
        top = viewportPadding;
      }
      if (left < viewportPadding) {
        left = viewportPadding;
      }
      if (left + tooltipRect.width > window.innerWidth - viewportPadding) {
        left = Math.max(viewportPadding, window.innerWidth - viewportPadding - tooltipRect.width);
      }

      setTooltipPosition({
        top,
        left,
      });
    };

    computePosition();
    window.addEventListener("resize", computePosition);
    window.addEventListener("scroll", computePosition, true);

    return () => {
      window.removeEventListener("resize", computePosition);
      window.removeEventListener("scroll", computePosition, true);
    };
  }, [tooltipState]);

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, [clearCloseTimeout]);

  return (
    <section
      className="w-full rounded-2xl border border-slate-800/90 bg-[linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0.46))] p-3 md:p-4"
      aria-label="Görev Performans Takvimi bölümü"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 overflow-x-auto">
          <div className="inline-grid min-w-max grid-cols-[auto_1fr] items-start text-[10px]">
            <div
              aria-hidden="true"
              style={{
                width: `${WEEKDAY_LABEL_COLUMN_WIDTH_PX}px`,
                height: `${MONTH_LABEL_ROW_HEIGHT_PX}px`,
              }}
            />
            <div
              className="grid items-end text-slate-500"
              aria-hidden="true"
              style={{
                height: `${MONTH_LABEL_ROW_HEIGHT_PX}px`,
                marginLeft: `${LABEL_TO_GRID_GAP_PX + GRID_BOX_INSET_PX}px`,
                gridTemplateColumns: `repeat(${WEEKS_TO_SHOW}, ${GRID_CELL_SIZE_PX}px)`,
                columnGap: `${GRID_GAP_PX}px`,
              }}
            >
              {Array.from({ length: WEEKS_TO_SHOW }, (_, weekIndex) => (
                <span key={`month-${weekIndex}`} className="justify-self-start whitespace-nowrap leading-4">
                  {monthLabelByWeek.get(weekIndex) ?? ""}
                </span>
              ))}
            </div>

            <div
              className="grid text-slate-500"
              aria-hidden="true"
              style={{
                width: `${WEEKDAY_LABEL_COLUMN_WIDTH_PX}px`,
                marginTop: `${HEADER_BODY_GAP_PX + GRID_BOX_INSET_PX}px`,
                gridTemplateRows: `repeat(${DAYS_PER_WEEK}, ${GRID_CELL_SIZE_PX}px)`,
                rowGap: `${GRID_GAP_PX}px`,
              }}
            >
              {Array.from({ length: DAYS_PER_WEEK }, (_, rowIndex) => (
                <span key={`weekday-${rowIndex}`} className="flex items-center leading-[10px]">
                  {DAY_LABEL_BY_ROW[rowIndex] ?? ""}
                </span>
              ))}
            </div>
            <div
              className="rounded-lg border border-slate-800/80 bg-slate-950/35"
              style={{
                marginLeft: `${LABEL_TO_GRID_GAP_PX}px`,
                marginTop: `${HEADER_BODY_GAP_PX}px`,
                padding: `${GRID_BOX_PADDING_PX}px`,
              }}
            >
              <div
                className="grid"
                role="grid"
                aria-label={`Son ${WEEKS_TO_SHOW} haftalık görev performans takvimi`}
                style={{
                  gridTemplateColumns: `repeat(${WEEKS_TO_SHOW}, ${GRID_CELL_SIZE_PX}px)`,
                  gridTemplateRows: `repeat(${DAYS_PER_WEEK}, ${GRID_CELL_SIZE_PX}px)`,
                  gridAutoFlow: "column",
                  columnGap: `${GRID_GAP_PX}px`,
                  rowGap: `${GRID_GAP_PX}px`,
                }}
              >
                {cells.map((cell) => {
                  const hasActivity = cell.completedCount > 0 || cell.failedCount > 0;
                  const toneClass = getCellColorClass(cell.score, hasActivity, cell.isFuture);
                  const formattedDate = formatter.format(new Date(cell.timestamp));
                  const ariaLabel = cell.isFuture
                    ? `${formattedDate}, gelecek gün`
                    : `${formattedDate}, günlük skor ${formatSignedScore(cell.score)}, ${cell.completedCount} tamamlanan, ${cell.failedCount} başarısız`;

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onMouseEnter={(event) => {
                        openTooltip(cell, event.currentTarget);
                      }}
                      onMouseLeave={(event) => {
                        scheduleCloseTooltip(event.currentTarget);
                      }}
                      onFocus={(event) => {
                        openTooltip(cell, event.currentTarget);
                      }}
                      onBlur={(event) => {
                        scheduleCloseTooltip(event.currentTarget);
                      }}
                      aria-label={ariaLabel}
                      aria-describedby={activeCell?.key === cell.key ? tooltipPanelId : undefined}
                      className={[
                        "rounded-[3px] border transition",
                        "hover:scale-[1.08] hover:border-slate-400/60",
                        "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                        "cursor-default",
                        cell.dayOfWeek === 0 ? "shadow-[inset_0_0_0_1px_rgba(15,23,42,0.35)]" : "",
                        toneClass,
                      ].join(" ")}
                      style={{
                        width: `${GRID_CELL_SIZE_PX}px`,
                        height: `${GRID_CELL_SIZE_PX}px`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <p className="shrink-0 self-start pt-0.5 text-xs font-medium text-slate-300 sm:text-right">
          Günlük net skor:{" "}
          <span className={dailyNetScore > 0 ? "text-emerald-300" : dailyNetScore < 0 ? "text-rose-300" : "text-slate-300"}>
            {formatSignedScore(dailyNetScore)}
          </span>
        </p>
      </div>

      {activeCell ? (
        <div
          ref={tooltipRef}
          id={tooltipPanelId}
          role="tooltip"
          className={[
            "pointer-events-none fixed z-[80] w-[210px] rounded-xl border px-3 py-2 text-[11px]",
            "shadow-[0_12px_28px_-18px_rgba(15,23,42,0.9)]",
            panelToneClass,
          ].join(" ")}
          style={{
            top: tooltipPosition?.top ?? -9999,
            left: tooltipPosition?.left ?? -9999,
            visibility: tooltipPosition ? "visible" : "hidden",
          }}
        >
          <p className="text-[11px] font-medium text-slate-200">{activeDateLabel}</p>
          <dl className="mt-1 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-[11px]">
            <dt className="text-slate-400">Net skor</dt>
            <dd className={["font-semibold", activeScoreClass].join(" ")}>{activeScoreLabel}</dd>
            <dt className="text-slate-400">Tamamlanan</dt>
            <dd className="text-slate-200">{activeCompletedCount}</dd>
            <dt className="text-slate-400">Başarısız</dt>
            <dd className="text-slate-200">{activeFailedCount}</dd>
          </dl>
        </div>
      ) : null}
    </section>
  );
}
