import englishWords from "./english-3000-tr.json";
import germanWords from "./german-1000-tr.json";
import italianWords from "./italian-1000-tr.json";

import type {
  VocabularyDatasetMeta,
  VocabularyDifficulty,
  VocabularyLanguage,
  VocabularyPracticeExercise,
  VocabularyWord,
} from "../types";

type RawVocabularyEntry = {
  id: number;
  rank: number;
  word: string;
  turkishTranslation: string;
};

export const VOCABULARY_LANGUAGE_WORD_TARGETS: Record<VocabularyLanguage, number> = {
  english: 3000,
  italian: 1000,
  german: 1000,
};

export const VOCABULARY_LANGUAGE_LABELS: Record<VocabularyLanguage, string> = {
  english: "English",
  italian: "Italian",
  german: "German",
};

export const VOCABULARY_LANGUAGE_SOURCE_LABELS: Record<VocabularyLanguage, string> = {
  english: "English",
  italian: "Italiano",
  german: "Deutsch",
};

const RAW_DATA_BY_LANGUAGE: Record<VocabularyLanguage, RawVocabularyEntry[]> = {
  english: englishWords,
  italian: italianWords,
  german: germanWords,
};

function normalizeWordToken(value: string): string {
  return value.trim().toLowerCase();
}

function createAutoDifficulty(rank: number): VocabularyDifficulty {
  if (rank <= 300) {
    return "easy";
  }

  if (rank <= 1200) {
    return "medium";
  }

  return "hard";
}

function createAutoTags(rank: number): string[] {
  if (rank <= 300) {
    return ["core", "high-frequency"];
  }

  if (rank <= 1000) {
    return ["daily-usage"];
  }

  return ["extended-set"];
}

function createAutoExampleSentences(word: string, language: VocabularyLanguage): string[] {
  if (language === "english") {
    return [
      `I used "${word}" in a sentence today.`,
      `Try to remember "${word}" with context.`,
      `Write one short example using "${word}".`,
    ];
  }

  if (language === "italian") {
    return [
      `Ho usato "${word}" in una frase oggi.`,
      `Ripeti "${word}" ad alta voce.`,
      `Scrivi una frase breve con "${word}".`,
    ];
  }

  return [
    `Ich habe "${word}" heute in einem Satz benutzt.`,
    `Wiederhole "${word}" laut.`,
    `Schreib einen kurzen Satz mit "${word}".`,
  ];
}

function sanitizeTranslation(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "ceviri bulunamadi";
}

function buildDatasetByLanguage(language: VocabularyLanguage): VocabularyWord[] {
  const targetSize = VOCABULARY_LANGUAGE_WORD_TARGETS[language];
  const rawEntries = RAW_DATA_BY_LANGUAGE[language];

  if (rawEntries.length < targetSize) {
    throw new Error(
      `Vocabulary dataset for ${language} is incomplete: expected ${targetSize}, got ${rawEntries.length}.`
    );
  }

  const seenWords = new Set<string>();
  const dataset: VocabularyWord[] = [];

  for (const entry of rawEntries) {
    const word = normalizeWordToken(entry.word);

    if (!word || seenWords.has(word)) {
      continue;
    }

    seenWords.add(word);

    const rank = dataset.length + 1;

    dataset.push({
      id: rank,
      rank,
      word,
      language,
      turkishTranslation: sanitizeTranslation(entry.turkishTranslation),
      exampleSentences: createAutoExampleSentences(word, language),
      difficulty: createAutoDifficulty(rank),
      tags: createAutoTags(rank),
    });

    if (dataset.length === targetSize) {
      break;
    }
  }

  if (dataset.length < targetSize) {
    throw new Error(
      `Vocabulary dataset for ${language} has insufficient unique words: expected ${targetSize}, got ${dataset.length}.`
    );
  }

  return dataset;
}

export const VOCABULARY_DATA_BY_LANGUAGE: Record<VocabularyLanguage, VocabularyWord[]> = {
  english: buildDatasetByLanguage("english"),
  italian: buildDatasetByLanguage("italian"),
  german: buildDatasetByLanguage("german"),
};

export const VOCABULARY_DATASET_META: VocabularyDatasetMeta = {
  version: "multi-language-turkish-target-v3",
  languageCounts: VOCABULARY_LANGUAGE_WORD_TARGETS,
  totalWords:
    VOCABULARY_LANGUAGE_WORD_TARGETS.english +
    VOCABULARY_LANGUAGE_WORD_TARGETS.italian +
    VOCABULARY_LANGUAGE_WORD_TARGETS.german,
  isMockData: false,
};

const WORD_BY_LANGUAGE_AND_ID: Record<VocabularyLanguage, Map<number, VocabularyWord>> = {
  english: new Map(VOCABULARY_DATA_BY_LANGUAGE.english.map((word) => [word.id, word])),
  italian: new Map(VOCABULARY_DATA_BY_LANGUAGE.italian.map((word) => [word.id, word])),
  german: new Map(VOCABULARY_DATA_BY_LANGUAGE.german.map((word) => [word.id, word])),
};

const WORD_BY_LANGUAGE_AND_TEXT: Record<VocabularyLanguage, Map<string, VocabularyWord>> = {
  english: new Map(VOCABULARY_DATA_BY_LANGUAGE.english.map((word) => [word.word.toLowerCase(), word])),
  italian: new Map(VOCABULARY_DATA_BY_LANGUAGE.italian.map((word) => [word.word.toLowerCase(), word])),
  german: new Map(VOCABULARY_DATA_BY_LANGUAGE.german.map((word) => [word.word.toLowerCase(), word])),
};

export function getVocabularyWords(language: VocabularyLanguage): VocabularyWord[] {
  return VOCABULARY_DATA_BY_LANGUAGE[language];
}

export function getVocabularyWordById(language: VocabularyLanguage, wordId: number): VocabularyWord | null {
  return WORD_BY_LANGUAGE_AND_ID[language].get(wordId) ?? null;
}

export function hasWordIdForLanguage(language: VocabularyLanguage, wordId: number): boolean {
  return WORD_BY_LANGUAGE_AND_ID[language].has(wordId);
}

export function getFirstWordIdForLanguage(language: VocabularyLanguage): number {
  return VOCABULARY_DATA_BY_LANGUAGE[language][0]?.id ?? 1;
}

export function getWordMeaning(word: VocabularyWord): string {
  return word.turkishTranslation;
}

export function mockTranslateInput(rawInput: string, sourceLanguage: VocabularyLanguage): string {
  const normalizedInput = rawInput.trim().toLowerCase();

  if (!normalizedInput) {
    return "";
  }

  const directWord = WORD_BY_LANGUAGE_AND_TEXT[sourceLanguage].get(normalizedInput);

  if (directWord) {
    return directWord.turkishTranslation;
  }

  return sourceLanguage === "english"
    ? "Not found in local dataset"
    : "Yerel veri setinde bulunamadi";
}

export function createPracticeExercise(word: VocabularyWord): VocabularyPracticeExercise {
  const sourceSentence = word.exampleSentences[0] ?? `Use "${word.word}" in a sentence.`;
  const escapedWord = word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escapedWord}\\b`, "i");
  const hasMatch = regex.test(sourceSentence);
  const sentenceWithBlank = hasMatch
    ? sourceSentence.replace(regex, "_____")
    : `_____ kelimesini bosluga yazin.`;

  return {
    sentenceWithBlank,
    expectedWord: word.word,
  };
}
