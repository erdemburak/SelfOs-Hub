"use client";

import { useMemo } from "react";

import { useVocabularyStudy } from "../hooks";
import { VOCABULARY_LANGUAGES } from "../types";
import { LanguageTabs } from "./language-tabs";
import { MeaningCard } from "./meaning-card";
import { PracticeSection } from "./practice-section";
import { ProgressSummary } from "./progress-summary";
import { TranslatorPanel } from "./translator-panel";
import { WordActions } from "./word-actions";
import { WordCard } from "./word-card";

export function VocabularyPageClient() {
  const {
    datasetMeta,
    words,
    currentWord,
    currentMeaning,
    selectedLanguage,
    uiLanguage,
    learnedWordSet,
    practiceWordSet,
    practiceWords,
    learnedCount,
    practiceCount,
    remainingCount,
    progressRatio,
    translator,
    markAsLearned,
    markNeedsPractice,
    goToNextWord,
    setSelectedLanguage,
    setTranslatorInput,
    runTranslator,
    translateCurrentWord,
    removePracticeWord,
    jumpToWord,
    resetProgress,
  } = useVocabularyStudy();

  const progressInDeck = useMemo(() => {
    if (!currentWord || words.length === 0) {
      return 0;
    }

    return Math.round((currentWord.rank / words.length) * 100);
  }, [currentWord, words.length]);

  const learningCopy =
    uiLanguage === "english"
      ? {
          wordsLabel: "Words",
          workspaceTitle: "Focused Study Workspace",
          wordOf: "Word",
          of: "of",
        }
      : {
          wordsLabel: "Kelimeler",
          workspaceTitle: "Odakli Calisma Alani",
          wordOf: "Kelime",
          of: "/",
        };

  if (!currentWord) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/35 p-6">
        <p className="text-sm text-slate-300">
          {uiLanguage === "english" ? "Vocabulary dataset is not available right now." : "Kelime verisi su an kullanilamiyor."}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 backdrop-blur-sm md:p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Vocabulary Lab</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-100">Build your high-frequency vocabulary command</h3>
            <p className="mt-1 text-sm text-slate-400">
              Study one word at a time, track progress, and revisit weak points in your practice queue.
            </p>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
            Deck Progress {progressInDeck}%
          </span>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <LanguageTabs
            languages={[...VOCABULARY_LANGUAGES]}
            selectedLanguage={selectedLanguage}
            onChange={setSelectedLanguage}
          />
          <ProgressSummary
            learnedCount={learnedCount}
            practiceCount={practiceCount}
            remainingCount={remainingCount}
            totalCount={words.length}
            progressRatio={progressRatio}
            onReset={resetProgress}
            isMockDataset={datasetMeta.isMockData}
            selectedLanguage={selectedLanguage}
          />
        </div>

        <TranslatorPanel
          selectedLanguage={selectedLanguage}
          inputValue={translator.input}
          outputValue={translator.output}
          onInputChange={setTranslatorInput}
          onTranslate={runTranslator}
          onUseCurrentWord={translateCurrentWord}
        />
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{learningCopy.wordsLabel}</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-100">{learningCopy.workspaceTitle}</h3>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
            {learningCopy.wordOf} #{currentWord.rank} {learningCopy.of} {words.length}
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <WordCard
            word={currentWord}
            isLearned={learnedWordSet.has(currentWord.id)}
            isInPractice={practiceWordSet.has(currentWord.id)}
            uiLanguage={uiLanguage}
          />
          <MeaningCard word={currentWord} meaning={currentMeaning} uiLanguage={uiLanguage} />
        </div>

        <div className="mt-4">
          <WordActions
            onLearned={markAsLearned}
            onNeedsPractice={markNeedsPractice}
            onNextWord={goToNextWord}
            uiLanguage={uiLanguage}
          />
        </div>
      </section>

      <PracticeSection
        practiceWords={practiceWords}
        allWords={words}
        uiLanguage={uiLanguage}
        onRemovePracticeWord={removePracticeWord}
        onJumpToWord={jumpToWord}
      />
    </section>
  );
}
