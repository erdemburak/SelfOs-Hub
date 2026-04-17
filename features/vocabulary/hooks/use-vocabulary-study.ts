"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  VOCABULARY_DATASET_META,
  createDefaultVocabularyProgress,
  getVocabularyWordById,
  getVocabularyWords,
  getWordMeaning,
  loadVocabularyProgress,
  mockTranslateInput,
  saveVocabularyProgress,
} from "../lib";
import type {
  VocabularyLanguage,
  VocabularyLanguageProgress,
  VocabularyProgressState,
  VocabularyUiLanguage,
  VocabularyWord,
} from "../types";

function toUniqueWordIds(values: number[]): number[] {
  const uniqueValues = new Set<number>();

  for (const value of values) {
    uniqueValues.add(value);
  }

  return [...uniqueValues];
}

function pickNextWordId(
  language: VocabularyLanguage,
  currentWordId: number,
  learnedWordIds: number[],
  skipLearned: boolean
): number {
  const words = getVocabularyWords(language);
  const totalWords = words.length;

  if (totalWords === 0) {
    return 1;
  }

  const learnedSet = new Set(learnedWordIds);
  let nextIndex = words.findIndex((word) => word.id === currentWordId);
  nextIndex = nextIndex === -1 ? 0 : nextIndex;

  for (let step = 1; step <= totalWords; step += 1) {
    const candidateIndex = (nextIndex + step) % totalWords;
    const candidateWord = words[candidateIndex];

    if (!skipLearned || !learnedSet.has(candidateWord.id)) {
      return candidateWord.id;
    }
  }

  return words[nextIndex]?.id ?? words[0].id;
}

function updateTranslatorOutput(
  currentState: VocabularyProgressState,
  language: VocabularyLanguage,
  nextInput: string,
  translatedAt: number = Date.now()
): VocabularyProgressState {
  return {
    ...currentState,
    byLanguage: {
      ...currentState.byLanguage,
      [language]: {
        ...currentState.byLanguage[language],
        translator: {
          input: nextInput,
          output: mockTranslateInput(nextInput, language),
          lastTranslatedAt: translatedAt,
        },
      },
    },
  };
}

function updateActiveLanguageProgress(
  currentState: VocabularyProgressState,
  updater: (progress: VocabularyLanguageProgress) => VocabularyLanguageProgress
): VocabularyProgressState {
  const language = currentState.selectedLanguage;

  return {
    ...currentState,
    byLanguage: {
      ...currentState.byLanguage,
      [language]: updater(currentState.byLanguage[language]),
    },
  };
}

export function useVocabularyStudy() {
  const [state, setState] = useState<VocabularyProgressState>(() => loadVocabularyProgress());

  useEffect(() => {
    saveVocabularyProgress({
      ...state,
      savedAt: Date.now(),
    });
  }, [state]);

  const selectedLanguage = state.selectedLanguage;
  const uiLanguage: VocabularyUiLanguage = selectedLanguage === "english" ? "english" : "turkish";
  const words = useMemo(() => getVocabularyWords(selectedLanguage), [selectedLanguage]);
  const activeProgress = state.byLanguage[selectedLanguage];

  const currentWord = useMemo(
    () => getVocabularyWordById(selectedLanguage, activeProgress.currentWordId) ?? words[0] ?? null,
    [activeProgress.currentWordId, selectedLanguage, words]
  );

  const learnedWordSet = useMemo(() => new Set(activeProgress.learnedWordIds), [activeProgress.learnedWordIds]);
  const practiceWordSet = useMemo(() => new Set(activeProgress.practiceWordIds), [activeProgress.practiceWordIds]);

  const learnedCount = activeProgress.learnedWordIds.length;
  const practiceCount = activeProgress.practiceWordIds.length;
  const totalCount = words.length;
  const remainingCount = Math.max(0, totalCount - learnedCount);
  const progressRatio = totalCount === 0 ? 0 : learnedCount / totalCount;

  const practiceWords = useMemo(
    () =>
      activeProgress.practiceWordIds
        .map((wordId) => getVocabularyWordById(selectedLanguage, wordId))
        .filter((word): word is VocabularyWord => word !== null),
    [activeProgress.practiceWordIds, selectedLanguage]
  );

  const markAsLearned = useCallback(() => {
    setState((currentState) =>
      updateActiveLanguageProgress(currentState, (progress) => {
        const language = currentState.selectedLanguage;
        const activeWord = getVocabularyWordById(language, progress.currentWordId);

        if (!activeWord) {
          return progress;
        }

        const learnedWordIds = toUniqueWordIds([...progress.learnedWordIds, activeWord.id]);
        const practiceWordIds = progress.practiceWordIds.filter((wordId) => wordId !== activeWord.id);
        const nextWordId = pickNextWordId(language, activeWord.id, learnedWordIds, true);

        return {
          ...progress,
          learnedWordIds,
          practiceWordIds,
          currentWordId: nextWordId,
        };
      })
    );
  }, []);

  const markNeedsPractice = useCallback(() => {
    setState((currentState) =>
      updateActiveLanguageProgress(currentState, (progress) => {
        const language = currentState.selectedLanguage;
        const activeWord = getVocabularyWordById(language, progress.currentWordId);

        if (!activeWord) {
          return progress;
        }

        const practiceWordIds = toUniqueWordIds([...progress.practiceWordIds, activeWord.id]).filter(
          (wordId) => !progress.learnedWordIds.includes(wordId)
        );
        const nextWordId = pickNextWordId(language, activeWord.id, progress.learnedWordIds, true);

        return {
          ...progress,
          practiceWordIds,
          currentWordId: nextWordId,
        };
      })
    );
  }, []);

  const goToNextWord = useCallback(() => {
    setState((currentState) =>
      updateActiveLanguageProgress(currentState, (progress) => ({
        ...progress,
        currentWordId: pickNextWordId(
          currentState.selectedLanguage,
          progress.currentWordId,
          progress.learnedWordIds,
          false
        ),
      }))
    );
  }, []);

  const setSelectedLanguage = useCallback((language: VocabularyLanguage) => {
    setState((currentState) => {
      if (currentState.selectedLanguage === language) {
        return currentState;
      }

      return {
        ...currentState,
        selectedLanguage: language,
      };
    });
  }, []);

  const setTranslatorInput = useCallback((input: string) => {
    setState((currentState) =>
      updateActiveLanguageProgress(currentState, (progress) => ({
        ...progress,
        translator: {
          ...progress.translator,
          input,
        },
      }))
    );
  }, []);

  const runTranslator = useCallback(() => {
    setState((currentState) =>
      updateTranslatorOutput(
        currentState,
        currentState.selectedLanguage,
        currentState.byLanguage[currentState.selectedLanguage].translator.input
      )
    );
  }, []);

  const translateCurrentWord = useCallback(() => {
    setState((currentState) => {
      const language = currentState.selectedLanguage;
      const progress = currentState.byLanguage[language];
      const activeWord = getVocabularyWordById(language, progress.currentWordId);
      const nextInput = activeWord?.word ?? progress.translator.input;

      return updateTranslatorOutput(currentState, language, nextInput);
    });
  }, []);

  const removePracticeWord = useCallback((wordId: number) => {
    setState((currentState) =>
      updateActiveLanguageProgress(currentState, (progress) => ({
        ...progress,
        practiceWordIds: progress.practiceWordIds.filter((value) => value !== wordId),
      }))
    );
  }, []);

  const jumpToWord = useCallback((wordId: number) => {
    setState((currentState) =>
      updateActiveLanguageProgress(currentState, (progress) => {
        const language = currentState.selectedLanguage;
        const targetWord = getVocabularyWordById(language, wordId);

        if (!targetWord) {
          return progress;
        }

        return {
          ...progress,
          currentWordId: targetWord.id,
        };
      })
    );
  }, []);

  const resetProgress = useCallback(() => {
    setState(createDefaultVocabularyProgress());
  }, []);

  const currentMeaning = currentWord ? getWordMeaning(currentWord) : "";

  return {
    datasetMeta: VOCABULARY_DATASET_META,
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
    translator: activeProgress.translator,
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
  };
}
