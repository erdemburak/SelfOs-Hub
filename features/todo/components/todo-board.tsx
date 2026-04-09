"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";

import { useTodoBoard } from "../hooks";
import { TODO_COLUMNS, type TodoCardUpdate, type TodoColumnId, type TodoDragData } from "../types";
import { AddTodoCardForm } from "./add-todo-card-form";
import { TodoCardDetailsModal } from "./todo-card-details-modal";
import { TodoCardDragOverlay } from "./todo-card";
import { TodoColumn } from "./todo-column";
import { TodoPerformanceCalendar } from "./todo-performance-calendar";

export function TodoBoard() {
  const { board, outcomes, addCard, addNote, updateCard, moveCard, deleteCard, getCardById } = useTodoBoard();
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeCardColumnId, setActiveCardColumnId] = useState<TodoColumnId | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [pendingCompletionCardId, setPendingCompletionCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeCard = useMemo(() => {
    if (!activeCardId) {
      return null;
    }

    return getCardById(activeCardId);
  }, [activeCardId, getCardById]);

  const selectedCard = useMemo(() => {
    if (!selectedCardId) {
      return null;
    }

    return getCardById(selectedCardId);
  }, [selectedCardId, getCardById]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(String(event.active.id));
    const data = event.active.data.current as TodoDragData | undefined;
    setActiveCardColumnId(data?.type === "card" ? data.columnId : null);
  };

  const handleDragCancel = () => {
    setActiveCardId(null);
    setActiveCardColumnId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeData = active.data.current as TodoDragData | undefined;
    const sourceColumnId = activeData?.type === "card" ? activeData.columnId : null;
    setActiveCardId(null);
    setActiveCardColumnId(null);

    if (!over) {
      return;
    }

    const draggedCardId = String(active.id);
    const overData = over.data.current as TodoDragData | undefined;

    if (!overData) {
      return;
    }

    if (overData.type === "column") {
      if (overData.columnId === "done" && sourceColumnId && sourceColumnId !== "done") {
        setPendingCompletionCardId(draggedCardId);
        return;
      }

      moveCard(draggedCardId, overData.columnId);
      return;
    }

    if (overData.columnId === "done" && sourceColumnId && sourceColumnId !== "done") {
      setPendingCompletionCardId(draggedCardId);
      return;
    }

    moveCard(draggedCardId, overData.columnId);
  };

  const handleOpenCard = (cardId: string) => {
    const card = getCardById(cardId);

    if (!card || card.isNote) {
      return;
    }

    setSelectedCardId(cardId);
  };

  const handleCloseCardDetails = () => {
    setSelectedCardId(null);
  };

  const handleSaveCardDetails = (update: TodoCardUpdate): boolean => {
    if (!selectedCardId) {
      return false;
    }

    return updateCard(selectedCardId, update);
  };

  const handleCancelCompletion = () => {
    setPendingCompletionCardId(null);
  };

  const handleConfirmCompletion = () => {
    if (!pendingCompletionCardId) {
      return;
    }

    moveCard(pendingCompletionCardId, "done");
    setPendingCompletionCardId(null);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 md:p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">ToDo Board</p>
        <div className="mt-2 flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(460px,560px)] lg:items-start lg:gap-6">
          <div className="space-y-4 lg:flex lg:h-full lg:flex-col lg:justify-center lg:space-y-0">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Görev Panosu</h3>
              <p className="mt-2 text-xs text-slate-400">
                Yeni kartlar varsayılan olarak Yapılacaklar sütununa eklenir. Tamamlanan kartlar 24 saat görünür, süresi dolanlar otomatik
                kaldırılır.
              </p>
            </div>
            <div className="lg:pt-4">
              <AddTodoCardForm onAddCard={addCard} onAddNote={addNote} />
            </div>
          </div>
          <div className="w-full lg:justify-self-end lg:self-start">
            <TodoPerformanceCalendar outcomes={outcomes} />
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div className="min-w-0 pb-2">
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TODO_COLUMNS.map((column) => (
              <TodoColumn
                key={column.id}
                column={column}
                cards={board[column.id] ?? []}
                onOpenCard={handleOpenCard}
                onDeleteCard={deleteCard}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeCard && activeCardColumnId ? (
            <TodoCardDragOverlay card={activeCard} columnId={activeCardColumnId} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TodoCardDetailsModal
        key={selectedCard?.id ?? "todo-card-details"}
        isOpen={Boolean(selectedCardId && selectedCard)}
        card={selectedCard}
        onClose={handleCloseCardDetails}
        onSave={handleSaveCardDetails}
      />

      {pendingCompletionCardId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Completion Confirmation</p>
            <h3 className="mt-2 text-base font-semibold text-slate-100">
              Are you sure you want to mark this task as completed?
            </h3>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelCompletion}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:text-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                className="rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-400 hover:text-emerald-100"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
