"use client";

import type { VocabularyUiLanguage, VocabularyWord } from "../types";

type MeaningCardProps = {
  word: VocabularyWord;
  meaning: string;
  uiLanguage: VocabularyUiLanguage;
};

export function MeaningCard({ word, meaning, uiLanguage }: MeaningCardProps) {
  const copy =
    uiLanguage === "english"
      ? {
          meaning: "Meaning",
          examples: "Example Sentences",
          turkish: "Turkish",
        }
      : {
          meaning: "Anlam",
          examples: "Ornek Cumleler",
          turkish: "Turkce",
        };

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900/45 p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{copy.meaning}</p>
        <span className="rounded-full border border-slate-700 bg-slate-900/75 px-2.5 py-1 text-[11px] text-slate-300">
          {copy.turkish}
        </span>
      </div>

      <p className="mt-5 text-2xl font-semibold leading-snug text-emerald-100">{meaning}</p>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <p className="text-xs text-slate-500">{copy.examples}</p>
        <ul className="mt-2 space-y-2">
          {word.exampleSentences.slice(0, 3).map((sentence, index) => (
            <li key={`${word.id}-example-${index}`} className="text-sm leading-relaxed text-slate-300">
              {sentence}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
