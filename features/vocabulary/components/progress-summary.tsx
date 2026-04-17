"use client";

import { VOCABULARY_LANGUAGE_SOURCE_LABELS } from "../lib";
import type { VocabularyLanguage } from "../types";

type ProgressSummaryProps = {
  learnedCount: number;
  practiceCount: number;
  remainingCount: number;
  totalCount: number;
  progressRatio: number;
  onReset: () => void;
  isMockDataset: boolean;
  selectedLanguage: VocabularyLanguage;
};

export function ProgressSummary({
  learnedCount,
  practiceCount,
  remainingCount,
  totalCount,
  progressRatio,
  onReset,
  isMockDataset,
  selectedLanguage,
}: ProgressSummaryProps) {
  const progressPercentage = Math.round(progressRatio * 100);
  const sourceLabel = VOCABULARY_LANGUAGE_SOURCE_LABELS[selectedLanguage];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/35 p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Progress</p>
          <h3 className="mt-1 text-base font-semibold text-slate-100">Vocabulary Journey</h3>
        </div>
        {isMockDataset ? (
          <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-100">
            {sourceLabel} mock frequency set
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-xs text-slate-500">Learned</p>
          <p className="mt-1 text-2xl font-semibold text-cyan-100">{learnedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-xs text-slate-500">Needs Practice</p>
          <p className="mt-1 text-2xl font-semibold text-amber-100">{practiceCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-xs text-slate-500">Remaining</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{remainingCount}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>{progressPercentage}% complete</span>
          <span>
            {learnedCount} / {totalCount}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-[width] duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>Daily streak placeholder: 3 days</span>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-[11px] text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
        >
          Reset Progress
        </button>
      </div>
    </section>
  );
}
