"use client";

import { useMemo, useState } from "react";

import { createPracticeExercise } from "../lib";
import type { VocabularyUiLanguage, VocabularyWord } from "../types";

type FillResult = "idle" | "correct" | "incorrect";

type PracticeCardProps = {
  word: VocabularyWord;
  correctMeaning: string;
  meaningOptions: string[];
  onRemove: (wordId: number) => void;
  onJumpToWord: (wordId: number) => void;
  uiLanguage: VocabularyUiLanguage;
};

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

export function PracticeCard({
  word,
  correctMeaning,
  meaningOptions,
  onRemove,
  onJumpToWord,
  uiLanguage,
}: PracticeCardProps) {
  const [isMeaningVisible, setMeaningVisible] = useState(false);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [blankAnswer, setBlankAnswer] = useState("");
  const [fillResult, setFillResult] = useState<FillResult>("idle");

  const exercise = useMemo(() => createPracticeExercise(word), [word]);
  const isMeaningCorrect = selectedMeaning !== null && selectedMeaning === correctMeaning;
  const copy =
    uiLanguage === "english"
      ? {
          practiceWord: "Practice Word",
          studyThis: "Study This",
          remove: "Remove",
          revealMeaning: "Reveal Meaning",
          hide: "Hide",
          reveal: "Reveal",
          meaningHidden: "Meaning hidden. Reveal it after you guess.",
          matchTitle: "Match Word to Meaning",
          correctMatch: "Correct match.",
          wrongMatch: "Not quite. Try another meaning.",
          fillBlank: "Fill in the Blank",
          inputPlaceholder: "Type missing word",
          check: "Check",
          correctFill: "Correct. Nice recall.",
          wrongFill: `Not correct yet. Hint: "${word.word}"`,
        }
      : {
          practiceWord: "Pratik Kelimesi",
          studyThis: "Bu Kelimeyi Calis",
          remove: "Listeden Cikar",
          revealMeaning: "Anlami Goster",
          hide: "Gizle",
          reveal: "Goster",
          meaningHidden: "Anlam gizli. Tahmin ettikten sonra goster.",
          matchTitle: "Kelimeyi Anlamla Eslestir",
          correctMatch: "Dogru eslestirme.",
          wrongMatch: "Tam olmadi. Baska anlam dene.",
          fillBlank: "Boslugu Doldur",
          inputPlaceholder: "Eksik kelimeyi yaz",
          check: "Kontrol Et",
          correctFill: "Dogru. Hatirlama guclu.",
          wrongFill: `Henuz dogru degil. Ipucu: "${word.word}"`,
        };

  const handleCheckBlank = () => {
    const isCorrect = normalizeAnswer(blankAnswer) === normalizeAnswer(exercise.expectedWord);
    setFillResult(isCorrect ? "correct" : "incorrect");
  };

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{copy.practiceWord}</p>
          <h4 className="mt-1 text-2xl font-semibold text-slate-100">{word.word}</h4>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onJumpToWord(word.id)}
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-[11px] text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
          >
            {copy.studyThis}
          </button>
          <button
            type="button"
            onClick={() => onRemove(word.id)}
            className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-100 transition hover:border-emerald-400/45"
          >
            {copy.remove}
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">{copy.revealMeaning}</p>
          <button
            type="button"
            onClick={() => setMeaningVisible((value) => !value)}
            className="rounded-md border border-slate-700 bg-slate-900/70 px-2 py-1 text-[11px] text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
          >
            {isMeaningVisible ? copy.hide : copy.reveal}
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-200">{isMeaningVisible ? correctMeaning : copy.meaningHidden}</p>
      </div>

      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
        <p className="text-xs text-slate-500">{copy.matchTitle}</p>
        <div className="mt-2 grid gap-2">
          {meaningOptions.map((option) => {
            const isSelected = selectedMeaning === option;
            const isCorrectOption = option === correctMeaning;
            const toneClassName = !isSelected
              ? "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-600 hover:text-slate-100"
              : isCorrectOption
                ? "border-emerald-400/45 bg-emerald-500/10 text-emerald-100"
                : "border-rose-400/45 bg-rose-500/10 text-rose-100";

            return (
              <button
                key={`${word.id}-${option}`}
                type="button"
                onClick={() => setSelectedMeaning(option)}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition ${toneClassName}`}
              >
                {option}
              </button>
            );
          })}
        </div>
        {selectedMeaning ? (
          <p className={`mt-2 text-xs ${isMeaningCorrect ? "text-emerald-200" : "text-rose-200"}`}>
            {isMeaningCorrect ? copy.correctMatch : copy.wrongMatch}
          </p>
        ) : null}
      </div>

      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
        <p className="text-xs text-slate-500">{copy.fillBlank}</p>
        <p className="mt-1 text-sm text-slate-300">{exercise.sentenceWithBlank}</p>
        <div className="mt-2 flex gap-2">
          <input
            value={blankAnswer}
            onChange={(event) => {
              setBlankAnswer(event.target.value);
              if (fillResult !== "idle") {
                setFillResult("idle");
              }
            }}
            placeholder={copy.inputPlaceholder}
            className="h-9 flex-1 rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500/60"
          />
          <button
            type="button"
            onClick={handleCheckBlank}
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:text-slate-100"
          >
            {copy.check}
          </button>
        </div>
        {fillResult === "correct" ? <p className="mt-2 text-xs text-emerald-200">{copy.correctFill}</p> : null}
        {fillResult === "incorrect" ? <p className="mt-2 text-xs text-rose-200">{copy.wrongFill}</p> : null}
      </div>
    </article>
  );
}
