export const VOCABULARY_LANGUAGES = ["english", "italian", "german"] as const;

export type VocabularyLanguage = (typeof VOCABULARY_LANGUAGES)[number];
export type VocabularyUiLanguage = "english" | "turkish";

export type VocabularyDifficulty = "easy" | "medium" | "hard";

export type VocabularyWord = {
  id: number;
  rank: number;
  word: string;
  language: VocabularyLanguage;
  turkishTranslation: string;
  exampleSentences: string[];
  difficulty: VocabularyDifficulty;
  tags: string[];
};

export type VocabularyTranslatorState = {
  input: string;
  output: string;
  lastTranslatedAt: number | null;
};

export type VocabularyLanguageProgress = {
  currentWordId: number;
  learnedWordIds: number[];
  practiceWordIds: number[];
  translator: VocabularyTranslatorState;
};

export type VocabularyProgressState = {
  selectedLanguage: VocabularyLanguage;
  byLanguage: Record<VocabularyLanguage, VocabularyLanguageProgress>;
  savedAt: number;
};

export type VocabularyPracticeExercise = {
  sentenceWithBlank: string;
  expectedWord: string;
};

export type VocabularyDatasetMeta = {
  version: string;
  languageCounts: Record<VocabularyLanguage, number>;
  totalWords: number;
  isMockData: boolean;
};
