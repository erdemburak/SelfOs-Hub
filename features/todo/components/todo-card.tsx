"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { HTMLAttributes } from "react";

import type { TodoCard as TodoCardType, TodoCategory, TodoColumnId, TodoPriority } from "../types";

type TodoCardFrameProps = {
  card: TodoCardType;
  columnId: TodoColumnId;
  onOpen?: () => void;
  onDelete?: () => void;
  className?: string;
  isDragging?: boolean;
  attributes?: HTMLAttributes<HTMLElement>;
  listeners?: HTMLAttributes<HTMLElement>;
};

const PRIORITY_LABELS: Record<TodoPriority, string> = {
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
};

const CATEGORY_LABELS: Record<TodoCategory, string> = {
  book: "Kitap",
  sports: "Spor",
  exam: "Sınav",
  project: "Proje",
  personal: "Personal",
  general: "Genel",
};

function getCardColors(columnId: TodoColumnId): { card: string; badge: string } {
  if (columnId === "in-progress") {
    return {
      card: "border-amber-400/30 bg-amber-500/10",
      badge: "border-amber-400/40 bg-amber-500/15 text-amber-100",
    };
  }

  if (columnId === "done") {
    return {
      card: "border-emerald-400/30 bg-emerald-500/10",
      badge: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
    };
  }

  return {
    card: "border-slate-700 bg-slate-900/70",
    badge: "border-slate-600 bg-slate-800/80 text-slate-200",
  };
}

function TodoCardFrame({
  card,
  columnId,
  onOpen,
  onDelete,
  className,
  isDragging = false,
  attributes,
  listeners,
}: TodoCardFrameProps) {
  const colors = getCardColors(columnId);
  const hasNoteTitle = card.isNote && card.title.trim().length > 0;

  return (
    <article
      className={[
        "min-w-0 cursor-pointer rounded-xl border p-3",
        "shadow-[0_8px_24px_-18px_rgba(15,23,42,0.85)]",
        isDragging ? "opacity-40" : "opacity-100",
        colors.card,
        className,
      ].join(" ")}
      {...attributes}
      {...listeners}
      onClick={onOpen}
    >
      {card.isNote ? (
        <div className="flex min-w-0 items-start justify-between gap-3">
          {hasNoteTitle ? <h4 className="min-w-0 break-words text-sm font-semibold text-slate-100">{card.title}</h4> : null}
          <div className="flex flex-wrap items-center justify-end gap-1">
            <button
              type="button"
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.();
              }}
              className="rounded-md border border-rose-400/40 bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-200 transition hover:border-rose-300/50 hover:text-rose-100"
              aria-label="Notu sil"
            >
              Sil
            </button>
            <span className="rounded-full border border-slate-600 bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-200">
              {CATEGORY_LABELS[card.category]}
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 items-start justify-between gap-3">
            <h4 className="min-w-0 break-words text-sm font-semibold text-slate-100">{card.title}</h4>
            <div className="flex flex-wrap items-center justify-end gap-1">
              <span className={["rounded-full border px-2 py-0.5 text-[11px] font-medium", colors.badge].join(" ")}>
                {PRIORITY_LABELS[card.priority]}
              </span>
              <span className="rounded-full border border-slate-600 bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                {CATEGORY_LABELS[card.category]}
              </span>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Son Gün: {card.dueDate}</p>
        </>
      )}
      {card.description ? (
        <p className="mt-2 break-words text-xs leading-relaxed text-slate-400">{card.description}</p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">Açıklama yok.</p>
      )}
    </article>
  );
}

type TodoCardProps = {
  card: TodoCardType;
  columnId: TodoColumnId;
  onOpen: (cardId: string) => void;
  onDelete?: (cardId: string) => void;
};

export function TodoCard({ card, columnId, onOpen = () => {}, onDelete }: TodoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: {
      type: "card",
      cardId: card.id,
      columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="min-w-0">
      <TodoCardFrame
        card={card}
        columnId={columnId}
        onOpen={() => {
          if (!isDragging && !card.isNote) {
            onOpen(card.id);
          }
        }}
        onDelete={() => {
          onDelete?.(card.id);
        }}
        isDragging={isDragging}
        attributes={attributes}
        listeners={listeners}
      />
    </div>
  );
}

type TodoCardDragOverlayProps = {
  card: TodoCardType;
  columnId: TodoColumnId;
};

export function TodoCardDragOverlay({ card, columnId }: TodoCardDragOverlayProps) {
  return <TodoCardFrame card={card} columnId={columnId} className="w-[320px] opacity-95" />;
}
