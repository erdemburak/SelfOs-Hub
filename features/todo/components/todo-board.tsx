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

export function TodoBoard() {
  const { board, addCard, addNote, updateCard, moveCard, deleteCard, getCardById } = useTodoBoard();
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeCardColumnId, setActiveCardColumnId] = useState<TodoColumnId | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

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
      moveCard(draggedCardId, overData.columnId);
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

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 md:p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">ToDo Board</p>
        <h3 className="mt-1 text-base font-semibold text-slate-100">Görev Panosu</h3>
        <p className="mt-2 mb-4 text-xs text-slate-400">
          Yeni kartlar varsayılan olarak Yapılacaklar sütununa eklenir. Tamamlanan kartlar 24 saat görünür, süresi dolanlar otomatik kaldırılır.
        </p>
        <AddTodoCardForm onAddCard={addCard} onAddNote={addNote} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-max grid-flow-col auto-cols-[minmax(260px,300px)] gap-4">
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
    </section>
  );
}
