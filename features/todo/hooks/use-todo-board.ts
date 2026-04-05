"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createEmptyTodoBoardState,
  loadTodoBoardState,
  saveTodoBoardState,
} from "../lib";
import {
  DEFAULT_TODO_CATEGORY,
  DEFAULT_TODO_COLUMN_ID,
  DEFAULT_TODO_PRIORITY,
  TODO_COLUMN_IDS,
  type TodoBoardState,
  type TodoCard,
  type TodoCardDraft,
  type TodoNoteDraft,
  type TodoCardUpdate,
  type TodoColumnId,
  type TodoPriority,
} from "../types";

type TodoCardLocation = {
  columnId: TodoColumnId;
  index: number;
};

function createTodoCardId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const PRIORITY_WEIGHT: Record<TodoPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};
const DONE_RETENTION_MS = 24 * 60 * 60 * 1000;
const NOTES_COLUMN_ID: TodoColumnId = "notes";
const NOTE_DUE_DATE_FALLBACK = "9999-12-31";

function sortCardsByPriority(cards: TodoCard[]): TodoCard[] {
  return [...cards].sort((firstCard, secondCard) => {
    if (firstCard.completedAt || secondCard.completedAt) {
      return (secondCard.completedAt ?? 0) - (firstCard.completedAt ?? 0);
    }

    const priorityDiff = PRIORITY_WEIGHT[secondCard.priority] - PRIORITY_WEIGHT[firstCard.priority];

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return secondCard.createdAt - firstCard.createdAt;
  });
}

function normalizeBoardState(state: Partial<TodoBoardState>): TodoBoardState {
  const baseState = createEmptyTodoBoardState();

  return TODO_COLUMN_IDS.reduce(
    (nextState, columnId) => {
      const cards = state[columnId];
      nextState[columnId] = Array.isArray(cards) ? sortCardsByPriority(cards) : [];
      return nextState;
    },
    baseState
  );
}

function createDueDateEndTimestamp(dueDate: string): number {
  const dueDateValue = new Date(`${dueDate}T23:59:59.999`).getTime();
  return Number.isNaN(dueDateValue) ? Number.MAX_SAFE_INTEGER : dueDateValue;
}

function isCardExpired(card: TodoCard, now: number): boolean {
  return createDueDateEndTimestamp(card.dueDate) < now;
}

function isCompletedCardExpired(card: TodoCard, now: number): boolean {
  if (typeof card.completedAt !== "number") {
    return true;
  }

  return now - card.completedAt >= DONE_RETENTION_MS;
}

function pruneCompletedAndExpiredCards(state: TodoBoardState, now: number): TodoBoardState {
  const normalizedState = normalizeBoardState(state);

  return TODO_COLUMN_IDS.reduce(
    (nextState, columnId) => {
      if (columnId === "done") {
        nextState[columnId] = normalizedState[columnId].filter((card) => !isCompletedCardExpired(card, now));
        return nextState;
      }

      nextState[columnId] = normalizedState[columnId].filter((card) => !isCardExpired(card, now));
      return nextState;
    },
    createEmptyTodoBoardState()
  );
}

function findCardLocation(state: TodoBoardState, cardId: string): TodoCardLocation | null {
  for (const columnId of TODO_COLUMN_IDS) {
    const cardIndex = state[columnId].findIndex((card) => card.id === cardId);

    if (cardIndex !== -1) {
      return {
        columnId,
        index: cardIndex,
      };
    }
  }

  return null;
}

function findCardById(state: TodoBoardState, cardId: string): TodoCard | null {
  for (const columnId of TODO_COLUMN_IDS) {
    const card = state[columnId].find((item) => item.id === cardId);

    if (card) {
      return card;
    }
  }

  return null;
}

function moveCardInState(
  state: TodoBoardState,
  cardId: string,
  targetColumnId: TodoColumnId
): TodoBoardState {
  const safeState = pruneCompletedAndExpiredCards(state, Date.now());
  const sourceLocation = findCardLocation(safeState, cardId);

  if (!sourceLocation) {
    return safeState;
  }

  if (sourceLocation.columnId === targetColumnId) {
    return safeState;
  }

  const sourceCards = [...safeState[sourceLocation.columnId]];
  const [movedCard] = sourceCards.splice(sourceLocation.index, 1);

  if (!movedCard) {
    return safeState;
  }

  if (targetColumnId === "done") {
    if (sourceLocation.columnId === "done") {
      return safeState;
    }

    const completedCard: TodoCard = {
      ...movedCard,
      completedAt: Date.now(),
    };

    return {
      ...safeState,
      [sourceLocation.columnId]: sortCardsByPriority(sourceCards),
      done: sortCardsByPriority([completedCard, ...safeState.done]),
    };
  }

  const targetCards = [...safeState[targetColumnId], { ...movedCard, completedAt: undefined }];

  return {
    ...safeState,
    [sourceLocation.columnId]: sortCardsByPriority(sourceCards),
    [targetColumnId]: sortCardsByPriority(targetCards),
  };
}

export function useTodoBoard() {
  const [board, setBoard] = useState<TodoBoardState>(() => {
    const initialBoardState = loadTodoBoardState() ?? createEmptyTodoBoardState();
    return pruneCompletedAndExpiredCards(initialBoardState, Date.now());
  });

  useEffect(() => {
    saveTodoBoardState(board);
  }, [board]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setBoard((currentBoard) => pruneCompletedAndExpiredCards(currentBoard, Date.now()));
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const addCard = useCallback((draft: TodoCardDraft): boolean => {
    const title = draft.title.trim();
    const dueDate = draft.dueDate.trim();

    if (!title || !dueDate) {
      return false;
    }

    const description = draft.description.trim();
    const nextCard: TodoCard = {
      id: createTodoCardId(),
      title,
      description,
      priority: draft.priority,
      category: draft.category ?? DEFAULT_TODO_CATEGORY,
      dueDate,
      createdAt: Date.now(),
      isNote: false,
      completedAt: undefined,
    };

    setBoard((currentBoard) => {
      const safeBoard = pruneCompletedAndExpiredCards(currentBoard, Date.now());
      const nextCards = sortCardsByPriority([nextCard, ...safeBoard[DEFAULT_TODO_COLUMN_ID]]);

      return {
        ...safeBoard,
        [DEFAULT_TODO_COLUMN_ID]: nextCards,
      };
    });

    return true;
  }, []);

  const addNote = useCallback((draft: TodoNoteDraft): boolean => {
    const title = draft.title.trim();
    const description = draft.description.trim();

    if (!description) {
      return false;
    }

    const nextNote: TodoCard = {
      id: createTodoCardId(),
      title,
      description,
      priority: DEFAULT_TODO_PRIORITY,
      category: DEFAULT_TODO_CATEGORY,
      dueDate: NOTE_DUE_DATE_FALLBACK,
      createdAt: Date.now(),
      isNote: true,
      completedAt: undefined,
    };

    setBoard((currentBoard) => {
      const safeBoard = pruneCompletedAndExpiredCards(currentBoard, Date.now());
      const nextCards = sortCardsByPriority([nextNote, ...safeBoard[NOTES_COLUMN_ID]]);

      return {
        ...safeBoard,
        [NOTES_COLUMN_ID]: nextCards,
      };
    });

    return true;
  }, []);

  const updateCard = useCallback((cardId: string, update: TodoCardUpdate): boolean => {
    const title = update.title.trim();
    const dueDate = update.dueDate.trim();

    if (!title || !dueDate) {
      return false;
    }

    const description = update.description.trim();

    setBoard((currentBoard) => {
      const safeBoard = pruneCompletedAndExpiredCards(currentBoard, Date.now());
      const location = findCardLocation(safeBoard, cardId);

      if (!location) {
        return safeBoard;
      }

      const nextCards = safeBoard[location.columnId].map((card) => {
        if (card.id !== cardId) {
          return card;
        }

        return {
          ...card,
          title,
          description,
          priority: update.priority,
          category: update.category,
          dueDate,
        };
      });

      return {
        ...safeBoard,
        [location.columnId]: sortCardsByPriority(nextCards),
      };
    });

    return true;
  }, []);

  const moveCard = useCallback(
    (cardId: string, targetColumnId: TodoColumnId): void => {
      setBoard((currentBoard) => moveCardInState(currentBoard, cardId, targetColumnId));
    },
    []
  );

  const deleteCard = useCallback((cardId: string): void => {
    setBoard((currentBoard) => {
      const safeBoard = pruneCompletedAndExpiredCards(currentBoard, Date.now());
      const location = findCardLocation(safeBoard, cardId);

      if (!location) {
        return safeBoard;
      }

      const nextCards = safeBoard[location.columnId].filter((card) => card.id !== cardId);

      return {
        ...safeBoard,
        [location.columnId]: sortCardsByPriority(nextCards),
      };
    });
  }, []);

  const getCardById = useCallback(
    (cardId: string): TodoCard | null => {
      return findCardById(board, cardId);
    },
    [board]
  );

  return {
    board,
    addCard,
    addNote,
    updateCard,
    moveCard,
    deleteCard,
    getCardById,
  };
}
