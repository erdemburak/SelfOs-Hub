"use client";

import type { VocabularyUiLanguage, VocabularyWord } from "../types";
import { PracticeCard } from "./practice-card";

type PracticeSectionProps = {
  practiceWords: VocabularyWord[];
  allWords: VocabularyWord[];
  uiLanguage: VocabularyUiLanguage;
  onRemovePracticeWord: (wordId: number) => void;
  onJumpToWord: (wordId: number) => void;
};

function seededShuffle(values: string[], seed: number): string[] {
  const nextValues = [...values];
  let currentSeed = seed;

  for (let index = nextValues.length - 1; index > 0; index -= 1) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    const swapIndex = currentSeed % (index + 1);
    const temp = nextValues[index];
    nextValues[index] = nextValues[swapIndex];
    nextValues[swapIndex] = temp;
  }

  return nextValues;
}

function createMeaningOptions(
  word: VocabularyWord,
  practiceWords: VocabularyWord[],
  allWords: VocabularyWord[]
): string[] {
  const correctMeaning = word.turkishTranslation;
  const distractorSet = new Set<string>();

  for (const practiceWord of practiceWords) {
    if (practiceWord.id === word.id) {
      continue;
    }

    distractorSet.add(practiceWord.turkishTranslation);

    if (distractorSet.size >= 2) {
      break;
    }
  }

  if (distractorSet.size < 2) {
    for (let offset = 0; offset < allWords.length && distractorSet.size < 2; offset += 1) {
      const candidateWord = allWords[(word.id + offset) % allWords.length];

      if (!candidateWord || candidateWord.id === word.id) {
        continue;
      }

      distractorSet.add(candidateWord.turkishTranslation);
    }
  }

  const options = [correctMeaning, ...[...distractorSet].filter((value) => value !== correctMeaning).slice(0, 2)];
  return seededShuffle(options, word.id);
}

export function PracticeSection({
  practiceWords,
  allWords,
  uiLanguage,
  onRemovePracticeWord,
  onJumpToWord,
}: PracticeSectionProps) {
  const copy =
    uiLanguage === "english"
      ? {
          queue: "Practice Queue",
          title: "Words Marked as Needs Practice",
          words: "words",
          emptyTitle: "No words in practice queue yet.",
          emptyHintPrefix: "Mark words as",
          emptyHintEmphasis: "Needs Practice",
          emptyHintSuffix: "to build your review set.",
        }
      : {
          queue: "Pratik Listesi",
          title: "Pratik Gereken Kelimeler",
          words: "kelime",
          emptyTitle: "Pratik listesinde henuz kelime yok.",
          emptyHintPrefix: "Kelimeyi",
          emptyHintEmphasis: "Pratik Gerekli",
          emptyHintSuffix: "olarak isaretleyerek liste olustur.",
        };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{copy.queue}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">{copy.title}</h3>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1 text-xs text-slate-300">
          {practiceWords.length} {copy.words}
        </span>
      </div>

      {practiceWords.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center">
          <p className="text-sm text-slate-300">{copy.emptyTitle}</p>
          <p className="mt-2 text-xs text-slate-500">
            {copy.emptyHintPrefix} <span className="font-medium text-amber-200">{copy.emptyHintEmphasis}</span>{" "}
            {copy.emptyHintSuffix}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {practiceWords.map((word) => (
            <PracticeCard
              key={word.id}
              word={word}
              correctMeaning={word.turkishTranslation}
              meaningOptions={createMeaningOptions(word, practiceWords, allWords)}
              onRemove={onRemovePracticeWord}
              onJumpToWord={onJumpToWord}
              uiLanguage={uiLanguage}
            />
          ))}
        </div>
      )}
    </section>
  );
}
