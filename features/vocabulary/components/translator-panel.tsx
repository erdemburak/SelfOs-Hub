"use client";

import { VOCABULARY_LANGUAGE_SOURCE_LABELS } from "../lib";
import type { VocabularyLanguage } from "../types";

type TranslatorPanelProps = {
  selectedLanguage: VocabularyLanguage;
  inputValue: string;
  outputValue: string;
  onInputChange: (value: string) => void;
  onTranslate: () => void;
  onUseCurrentWord: () => void;
};

export function TranslatorPanel({
  selectedLanguage,
  inputValue,
  outputValue,
  onInputChange,
  onTranslate,
  onUseCurrentWord,
}: TranslatorPanelProps) {
  const sourceLabel = VOCABULARY_LANGUAGE_SOURCE_LABELS[selectedLanguage];

  return (
    <aside className="rounded-2xl border border-slate-800 bg-slate-900/35 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Translator</p>
          <h3 className="mt-1 text-base font-semibold text-slate-100">Quick Meaning Check</h3>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-900/75 px-2.5 py-1 text-[11px] text-slate-300">
          {sourceLabel} to Turkish
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block space-y-1">
          <span className="text-xs text-slate-400">Input ({sourceLabel})</span>
          <textarea
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={`Type a ${sourceLabel.toLowerCase()} word`}
            className="h-20 w-full resize-none rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500/60"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onTranslate}
            className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/50"
          >
            Translate
          </button>
          <button
            type="button"
            onClick={onUseCurrentWord}
            className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:text-slate-100"
          >
            Use Current Word
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-xs text-slate-500">Output (Turkish)</p>
          <p className="mt-1 min-h-12 text-sm text-slate-200">
            {outputValue || "Translation output will appear here after you run translate."}
          </p>
        </div>
      </div>
    </aside>
  );
}
