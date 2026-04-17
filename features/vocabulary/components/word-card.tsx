"use client";

import type { VocabularyUiLanguage, VocabularyWord } from "../types";

type WordCardProps = {
  word: VocabularyWord;
  isLearned: boolean;
  isInPractice: boolean;
  uiLanguage: VocabularyUiLanguage;
};

export function WordCard({ word, isLearned, isInPractice, uiLanguage }: WordCardProps) {
  const copy =
    uiLanguage === "english"
      ? {
          rank: "Rank",
          currentWord: "Current Word",
          learned: "Learned",
          practice: "Practice",
        }
      : {
          rank: "Seviye",
          currentWord: "Mevcut Kelime",
          learned: "Ogrenildi",
          practice: "Pratik",
        };

  return (
    <article className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-950/80 p-6 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.95)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-300">
          {copy.rank} #{word.rank}
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-300">
          {word.difficulty}
        </span>
        {isLearned ? (
          <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-100">{copy.learned}</span>
        ) : null}
        {isInPractice ? (
          <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-100">
            {copy.practice}
          </span>
        ) : null}
      </div>

      <p className="mt-6 text-xs uppercase tracking-[0.16em] text-slate-500">{copy.currentWord}</p>
      <h4 className="mt-2 break-words font-serif text-5xl font-semibold tracking-tight text-slate-50 sm:text-6xl">{word.word}</h4>

      <div className="mt-5 flex flex-wrap gap-2">
        {word.tags.map((tag) => (
          <span key={`${word.id}-${tag}`} className="rounded-md border border-slate-700/80 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-400">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
