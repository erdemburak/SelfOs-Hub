"use client";

import { VOCABULARY_LANGUAGE_LABELS } from "../lib";
import type { VocabularyLanguage } from "../types";

type LanguageTabsProps = {
  languages: VocabularyLanguage[];
  selectedLanguage: VocabularyLanguage;
  onChange: (language: VocabularyLanguage) => void;
};

export function LanguageTabs({ languages, selectedLanguage, onChange }: LanguageTabsProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Study Language</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {languages.map((language) => {
          const isActive = selectedLanguage === language;

          return (
            <button
              key={language}
              type="button"
              onClick={() => onChange(language)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-cyan-400/45 bg-cyan-500/10 text-cyan-100"
                  : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-600 hover:text-slate-100"
              }`}
            >
              {VOCABULARY_LANGUAGE_LABELS[language]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
