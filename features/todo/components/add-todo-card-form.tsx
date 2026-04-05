"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  DEFAULT_TODO_CATEGORY,
  DEFAULT_TODO_PRIORITY,
  TODO_CATEGORY_OPTIONS,
  TODO_PRIORITY_OPTIONS,
  type TodoCardDraft,
  type TodoNoteDraft,
  type TodoCategory,
  type TodoPriority,
} from "../types";

type AddTodoCardFormProps = {
  onAddCard: (draft: TodoCardDraft) => boolean;
  onAddNote: (draft: TodoNoteDraft) => boolean;
};

export function AddTodoCardForm({ onAddCard, onAddNote }: AddTodoCardFormProps) {
  const formControlClassName =
    "h-10 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none transition focus:border-teal-500/60";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<TodoPriority>(DEFAULT_TODO_PRIORITY);
  const [category, setCategory] = useState<TodoCategory>(DEFAULT_TODO_CATEGORY);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");

  useEffect(() => {
    if (!isModalOpen && !isNoteModalOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setIsNoteModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isModalOpen, isNoteModalOpen]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const didAddCard = onAddCard({
      title,
      description,
      priority,
      category,
      dueDate,
    });

    if (!didAddCard) {
      return;
    }

    setTitle("");
    setDescription("");
    setDueDate(new Date().toISOString().slice(0, 10));
    setPriority(DEFAULT_TODO_PRIORITY);
    setCategory(DEFAULT_TODO_CATEGORY);
    setIsModalOpen(false);
  };

  const handleNoteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const didAddNote = onAddNote({
      title: noteTitle,
      description: noteDescription,
    });

    if (!didAddNote) {
      return;
    }

    setNoteTitle("");
    setNoteDescription("");
    setIsNoteModalOpen(false);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl border border-teal-500/50 bg-teal-500/15 px-4 py-2 text-sm font-medium text-teal-200 transition hover:border-teal-400 hover:text-teal-100"
        >
          Kart Ekle
        </button>
        <button
          type="button"
          onClick={() => setIsNoteModalOpen(true)}
          className="rounded-xl border border-sky-500/50 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-200 transition hover:border-sky-400 hover:text-sky-100"
        >
          Not Ekle
        </button>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Yeni Görev</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-100">Haftalık Kart Ekle</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:text-slate-100"
              >
                Kapat
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Kart başlığı"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-teal-500/60"
                required
              />

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Kısa açıklama"
                className="min-h-24 w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-teal-500/60"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-slate-300">
                  Son Gün
                  <input
                    type="date"
                    value={dueDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(event) => setDueDate(event.target.value)}
                    className={formControlClassName}
                    required
                  />
                </label>

                <label className="grid gap-1 text-xs text-slate-300">
                  Önem Derecesi
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as TodoPriority)}
                    className={formControlClassName}
                  >
                    {TODO_PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-slate-300">
                  Kategori
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as TodoCategory)}
                    className={formControlClassName}
                  >
                    {TODO_CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:text-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="rounded-xl border border-teal-500/50 bg-teal-500/15 px-4 py-2 text-sm font-medium text-teal-200 transition hover:border-teal-400 hover:text-teal-100"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isNoteModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Yeni Not</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-100">Not Ekle</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:text-slate-100"
              >
                Kapat
              </button>
            </div>

            <form className="space-y-3" onSubmit={handleNoteSubmit}>
              <input
                value={noteTitle}
                onChange={(event) => setNoteTitle(event.target.value)}
                placeholder="Not başlığı (opsiyonel)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/60"
              />

              <textarea
                value={noteDescription}
                onChange={(event) => setNoteDescription(event.target.value)}
                placeholder="Not içeriği"
                className="min-h-28 w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/60"
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:text-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="rounded-xl border border-sky-500/50 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-200 transition hover:border-sky-400 hover:text-sky-100"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
