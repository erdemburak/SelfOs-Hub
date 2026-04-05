"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import type { TodoCard as TodoCardType, TodoColumn as TodoColumnType } from "../types";
import { TodoCard } from "./todo-card";

type TodoColumnProps = {
  column: TodoColumnType;
  cards: TodoCardType[];
  onOpenCard: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
};

export function TodoColumn({ column, cards, onOpenCard, onDeleteCard }: TodoColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${column.id}`,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  return (
    <section
      className={[
        "flex h-full min-h-[360px] min-w-[240px] flex-col rounded-2xl border bg-slate-900/35",
        column.id === "in-progress"
          ? "border-amber-400/30"
          : column.id === "done"
            ? "border-emerald-400/30"
            : "border-slate-800",
      ].join(" ")}
    >
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-100">{column.title}</h3>
        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
          {cards.length}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={[
          "flex flex-1 flex-col gap-3 p-3 transition-colors",
          isOver ? "bg-teal-500/5" : "",
        ].join(" ")}
      >
        <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <TodoCard
              key={card.id}
              card={card}
              columnId={column.id}
              onOpen={onOpenCard}
              onDelete={onDeleteCard}
            />
          ))}
        </SortableContext>

        {cards.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 px-3 py-5 text-center text-xs text-slate-500">
            Bu kolonda kart yok.
          </p>
        ) : null}
      </div>
    </section>
  );
}
