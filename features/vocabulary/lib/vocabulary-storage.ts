import {
  getFirstWordIdForLanguage,
  getVocabularyWords,
  hasWordIdForLanguage,
} from "./vocabulary-data";
import type {
  VocabularyLanguage,
  VocabularyLanguageProgress,
  VocabularyProgressState,
  VocabularyTranslatorState,
} from "../types";

export const VOCABULARY_STORAGE_KEY = "selfos.vocabulary.progress.v1";
const STORAGE_VERSION = 2 as const;

const DEFAULT_TRANSLATOR_STATE: VocabularyTranslatorState = {
  input: "",
  output: "",
  lastTranslatedAt: null,
};

function isVocabularyLanguage(value: unknown): value is VocabularyLanguage {
  return value === "english" || value === "italian" || value === "german";
}

function normalizeWordIdArray(language: VocabularyLanguage, value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueIds = new Set<number>();

  for (const candidate of value) {
    if (typeof candidate !== "number") {
      continue;
    }

    const rounded = Math.round(candidate);

    if (!hasWordIdForLanguage(language, rounded)) {
      continue;
    }

    uniqueIds.add(rounded);
  }

  return [...uniqueIds];
}

function normalizeTranslator(value: unknown): VocabularyTranslatorState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_TRANSLATOR_STATE;
  }

  const candidate = value as Record<string, unknown>;
  const input = typeof candidate.input === "string" ? candidate.input : "";
  const output = typeof candidate.output === "string" ? candidate.output : "";
  const lastTranslatedAt = typeof candidate.lastTranslatedAt === "number" ? candidate.lastTranslatedAt : null;

  return {
    input,
    output,
    lastTranslatedAt,
  };
}

function findFallbackCurrentWordId(language: VocabularyLanguage, learnedWordIds: number[]): number {
  const learnedSet = new Set(learnedWordIds);
  const firstUnlearned = getVocabularyWords(language).find((word) => !learnedSet.has(word.id));
  return firstUnlearned?.id ?? getFirstWordIdForLanguage(language);
}

function createDefaultLanguageProgress(language: VocabularyLanguage): VocabularyLanguageProgress {
  return {
    currentWordId: getFirstWordIdForLanguage(language),
    learnedWordIds: [],
    practiceWordIds: [],
    translator: DEFAULT_TRANSLATOR_STATE,
  };
}

function normalizeLanguageProgress(
  language: VocabularyLanguage,
  value: unknown
): VocabularyLanguageProgress {
  const fallback = createDefaultLanguageProgress(language);

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const candidate = value as Record<string, unknown>;
  const learnedWordIds = normalizeWordIdArray(language, candidate.learnedWordIds);
  const learnedSet = new Set(learnedWordIds);
  const practiceWordIds = normalizeWordIdArray(language, candidate.practiceWordIds).filter((wordId) => !learnedSet.has(wordId));
  const rawCurrentWordId = typeof candidate.currentWordId === "number" ? Math.round(candidate.currentWordId) : NaN;
  const currentWordId = hasWordIdForLanguage(language, rawCurrentWordId)
    ? rawCurrentWordId
    : findFallbackCurrentWordId(language, learnedWordIds);

  return {
    currentWordId,
    learnedWordIds,
    practiceWordIds,
    translator: normalizeTranslator(candidate.translator),
  };
}

export function createDefaultVocabularyProgress(now: number = Date.now()): VocabularyProgressState {
  return {
    selectedLanguage: "english",
    byLanguage: {
      english: createDefaultLanguageProgress("english"),
      italian: createDefaultLanguageProgress("italian"),
      german: createDefaultLanguageProgress("german"),
    },
    savedAt: now,
  };
}

function normalizeProgressState(value: unknown, now: number): VocabularyProgressState {
  const fallback = createDefaultVocabularyProgress(now);

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const candidate = value as Record<string, unknown>;
  const selectedLanguage = isVocabularyLanguage(candidate.selectedLanguage) ? candidate.selectedLanguage : fallback.selectedLanguage;
  const byLanguageRaw = candidate.byLanguage;

  if (byLanguageRaw && typeof byLanguageRaw === "object" && !Array.isArray(byLanguageRaw)) {
    const byLanguageObject = byLanguageRaw as Record<string, unknown>;

    return {
      selectedLanguage,
      byLanguage: {
        english: normalizeLanguageProgress("english", byLanguageObject.english),
        italian: normalizeLanguageProgress("italian", byLanguageObject.italian),
        german: normalizeLanguageProgress("german", byLanguageObject.german),
      },
      savedAt: typeof candidate.savedAt === "number" ? candidate.savedAt : now,
    };
  }

  // Legacy v1 migration (single-language arrays).
  const legacyLearnedWordIds = normalizeWordIdArray("english", candidate.learnedWordIds);
  const legacyLearnedSet = new Set(legacyLearnedWordIds);
  const legacyPracticeWordIds = normalizeWordIdArray("english", candidate.practiceWordIds).filter(
    (wordId) => !legacyLearnedSet.has(wordId)
  );
  const legacyCurrentWordIdRaw = typeof candidate.currentWordId === "number" ? Math.round(candidate.currentWordId) : NaN;
  const legacyCurrentWordId = hasWordIdForLanguage("english", legacyCurrentWordIdRaw)
    ? legacyCurrentWordIdRaw
    : findFallbackCurrentWordId("english", legacyLearnedWordIds);

  return {
    selectedLanguage,
    byLanguage: {
      english: {
        currentWordId: legacyCurrentWordId,
        learnedWordIds: legacyLearnedWordIds,
        practiceWordIds: legacyPracticeWordIds,
        translator: normalizeTranslator(candidate.translator),
      },
      italian: createDefaultLanguageProgress("italian"),
      german: createDefaultLanguageProgress("german"),
    },
    savedAt: typeof candidate.savedAt === "number" ? candidate.savedAt : now,
  };
}

export function loadVocabularyProgress(now: number = Date.now()): VocabularyProgressState {
  if (typeof window === "undefined") {
    return createDefaultVocabularyProgress(now);
  }

  try {
    const storedValue = window.localStorage.getItem(VOCABULARY_STORAGE_KEY);

    if (!storedValue) {
      return createDefaultVocabularyProgress(now);
    }

    const parsedValue = JSON.parse(storedValue) as unknown;
    return normalizeProgressState(parsedValue, now);
  } catch {
    return createDefaultVocabularyProgress(now);
  }
}

export function saveVocabularyProgress(state: VocabularyProgressState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      VOCABULARY_STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        ...state,
      })
    );
  } catch {
    // Ignore localStorage write failures.
  }
}
