"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  TODO_CATEGORY_OPTIONS,
  TODO_PRIORITY_OPTIONS,
  type TodoCard,
  type TodoCategory,
  type TodoCardUpdate,
  type TodoPriority,
} from "../types";

type TodoCardDetailsModalProps = {
  isOpen: boolean;
  card: TodoCard | null;
  onClose: () => void;
  onSave: (update: TodoCardUpdate) => boolean;
};

export function TodoCardDetailsModal({ isOpen, card, onClose, onSave }: TodoCardDetailsModalProps) {
  const formControlClassName =
    "h-10 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none transition focus:border-teal-500/60";
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [dueDate, setDueDate] = useState(card?.dueDate ?? "");
  const [priority, setPriority] = useState<TodoPriority>(card?.priority ?? "medium");
  const [category, setCategory] = useState<TodoCategory>(card?.category ?? "general");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !card) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const didUpdate = onSave({
      title,
      description,
      dueDate,
      priority,
      category,
    });

    if (!didUpdate) {
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-5 md:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Kart Detayı</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-100">Görevi Güncelle</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
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
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:text-slate-100"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="rounded-xl border border-teal-500/50 bg-teal-500/15 px-4 py-2 text-sm font-medium text-teal-200 transition hover:border-teal-400 hover:text-teal-100"
            >
              Güncelle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
