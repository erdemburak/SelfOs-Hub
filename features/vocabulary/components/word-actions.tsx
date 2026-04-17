"use client";

import type { VocabularyUiLanguage } from "../types";

type WordActionsProps = {
  onLearned: () => void;
  onNeedsPractice: () => void;
  onNextWord: () => void;
  uiLanguage: VocabularyUiLanguage;
};

export function WordActions({ onLearned, onNeedsPractice, onNextWord, uiLanguage }: WordActionsProps) {
  const copy =
    uiLanguage === "english"
      ? {
          learned: "Mark as Learned",
          needsPractice: "Needs Practice",
          next: "Change Word",
        }
      : {
          learned: "Ogrenildi Olarak Isaretle",
          needsPractice: "Pratik Gerekli",
          next: "Kelime Degistir",
        };

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <button
        type="button"
        onClick={onLearned}
        className="rounded-xl border border-cyan-400/45 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/55"
      >
        {copy.learned}
      </button>
      <button
        type="button"
        onClick={onNeedsPractice}
        className="rounded-xl border border-amber-400/45 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-100 transition hover:border-amber-300/55"
      >
        {copy.needsPractice}
      </button>
      <button
        type="button"
        onClick={onNextWord}
        className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:text-slate-100"
      >
        {copy.next}
      </button>
    </div>
  );
}
