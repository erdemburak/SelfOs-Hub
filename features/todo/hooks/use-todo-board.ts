"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createEmptyTodoBoardState,
  createEmptyTodoOutcomeMap,
  loadTodoBoardState,
  loadTodoOutcomeMap,
  saveTodoBoardState,
  saveTodoOutcomeMap,
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
  type TodoOutcome,
  type TodoOutcomeMap,
  type TodoPriority,
} from "../types";

type TodoCardLocation = {
  columnId: TodoColumnId;
  index: number;
};

type TodoState = {
  board: TodoBoardState;
  outcomes: TodoOutcomeMap;
};

type TodoOutcomeEventType = "completed" | "failed";

type TodoOutcomeEvent = {
  cardId: string;
  type: TodoOutcomeEventType;
  at: number;
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

function sortCardsByPriority(cards: TodoCard[], columnId: TodoColumnId): TodoCard[] {
  return [...cards].sort((firstCard, secondCard) => {
    if (columnId === "done" && (firstCard.completedAt || secondCard.completedAt)) {
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
      nextState[columnId] = Array.isArray(cards) ? sortCardsByPriority(cards, columnId) : [];
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

function createFailedOutcomeEvent(card: TodoCard): TodoOutcomeEvent | null {
  if (card.isNote) {
    return null;
  }

  if (typeof card.completedAt === "number" || typeof card.failedAt === "number") {
    return null;
  }

  const failedAt = createDueDateEndTimestamp(card.dueDate);

  if (!Number.isFinite(failedAt) || failedAt === Number.MAX_SAFE_INTEGER) {
    return null;
  }

  return {
    cardId: card.id,
    type: "failed",
    at: failedAt,
  };
}

function pruneCompletedAndExpiredCards(
  state: TodoBoardState,
  now: number
): { board: TodoBoardState; outcomeEvents: TodoOutcomeEvent[] } {
  const normalizedState = normalizeBoardState(state);
  const outcomeEvents: TodoOutcomeEvent[] = [];

  const board = TODO_COLUMN_IDS.reduce(
    (nextState, columnId) => {
      if (columnId === "done") {
        nextState[columnId] = normalizedState[columnId].filter((card) => !isCompletedCardExpired(card, now));
        return nextState;
      }

      nextState[columnId] = normalizedState[columnId].filter((card) => {
        if (!isCardExpired(card, now)) {
          return true;
        }

        const outcomeEvent = createFailedOutcomeEvent(card);

        if (outcomeEvent) {
          outcomeEvents.push(outcomeEvent);
        }

        return false;
      });
      return nextState;
    },
    createEmptyTodoBoardState()
  );

  return {
    board,
    outcomeEvents,
  };
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

function applyOutcomeEvent(outcomes: TodoOutcomeMap, event: TodoOutcomeEvent): TodoOutcomeMap {
  const existingOutcome = outcomes[event.cardId];

  if (existingOutcome && (typeof existingOutcome.completedAt === "number" || typeof existingOutcome.failedAt === "number")) {
    return outcomes;
  }

  const nextOutcome: TodoOutcome =
    event.type === "completed"
      ? {
          completedAt: event.at,
          failedAt: undefined,
        }
      : {
          completedAt: undefined,
          failedAt: event.at,
        };

  return {
    ...outcomes,
    [event.cardId]: nextOutcome,
  };
}

function removeCompletedOutcome(outcomes: TodoOutcomeMap, cardId: string): TodoOutcomeMap {
  const existingOutcome = outcomes[cardId];

  if (!existingOutcome || typeof existingOutcome.completedAt !== "number") {
    return outcomes;
  }

  if (typeof existingOutcome.failedAt === "number") {
    return {
      ...outcomes,
      [cardId]: {
        completedAt: undefined,
        failedAt: existingOutcome.failedAt,
      },
    };
  }

  const nextOutcomes = { ...outcomes };
  delete nextOutcomes[cardId];
  return nextOutcomes;
}

function applyOutcomeEvents(outcomes: TodoOutcomeMap, events: TodoOutcomeEvent[]): TodoOutcomeMap {
  if (events.length === 0) {
    return outcomes;
  }

  return events.reduce((nextOutcomes, event) => applyOutcomeEvent(nextOutcomes, event), outcomes);
}

function collectOutcomeEventsFromBoard(board: TodoBoardState): TodoOutcomeEvent[] {
  const events: TodoOutcomeEvent[] = [];

  for (const columnId of TODO_COLUMN_IDS) {
    for (const card of board[columnId]) {
      if (typeof card.completedAt === "number") {
        events.push({
          cardId: card.id,
          type: "completed",
          at: card.completedAt,
        });
        continue;
      }

      if (typeof card.failedAt === "number") {
        events.push({
          cardId: card.id,
          type: "failed",
          at: card.failedAt,
        });
      }
    }
  }

  return events;
}

function pruneState(state: TodoState, now: number): TodoState {
  const { board, outcomeEvents } = pruneCompletedAndExpiredCards(state.board, now);

  return {
    board,
    outcomes: applyOutcomeEvents(state.outcomes, outcomeEvents),
  };
}

function initializeTodoState(): TodoState {
  const loadedBoard = loadTodoBoardState() ?? createEmptyTodoBoardState();
  const loadedOutcomes = loadTodoOutcomeMap() ?? createEmptyTodoOutcomeMap();
  const normalizedBoard = normalizeBoardState(loadedBoard);
  const seededOutcomes = applyOutcomeEvents(loadedOutcomes, collectOutcomeEventsFromBoard(normalizedBoard));

  const initialState: TodoState = {
    board: normalizedBoard,
    outcomes: seededOutcomes,
  };

  return pruneState(initialState, Date.now());
}

function moveCardInState(
  state: TodoBoardState,
  cardId: string,
  targetColumnId: TodoColumnId,
  now: number
): { board: TodoBoardState; outcomeEvent?: TodoOutcomeEvent; rollbackCompletedCardId?: string } {
  const safeState = normalizeBoardState(state);
  const sourceLocation = findCardLocation(safeState, cardId);

  if (!sourceLocation) {
    return {
      board: safeState,
    };
  }

  if (sourceLocation.columnId === targetColumnId) {
    return {
      board: safeState,
    };
  }

  const sourceCards = [...safeState[sourceLocation.columnId]];
  const [movedCard] = sourceCards.splice(sourceLocation.index, 1);

  if (!movedCard) {
    return {
      board: safeState,
    };
  }

  if (targetColumnId === "done") {
    if (sourceLocation.columnId === "done") {
      return {
        board: safeState,
      };
    }

    const completionAt = movedCard.completedAt ?? now;
    const canCreateCompletionOutcome =
      typeof movedCard.completedAt !== "number" && typeof movedCard.failedAt !== "number";
    const completedCard: TodoCard = {
      ...movedCard,
      completedAt: completionAt,
      failedAt: undefined,
    };

    return {
      board: {
        ...safeState,
        [sourceLocation.columnId]: sortCardsByPriority(sourceCards, sourceLocation.columnId),
        done: sortCardsByPriority([completedCard, ...safeState.done], "done"),
      },
      outcomeEvent: canCreateCompletionOutcome
        ? {
            cardId: movedCard.id,
            type: "completed",
            at: completionAt,
          }
        : undefined,
    };
  }

  const targetCards = [
    ...safeState[targetColumnId],
    {
      ...movedCard,
      completedAt: undefined,
    },
  ];
  const rollbackCompletedCardId = sourceLocation.columnId === "done" ? movedCard.id : undefined;

  return {
    board: {
      ...safeState,
      [sourceLocation.columnId]: sortCardsByPriority(sourceCards, sourceLocation.columnId),
      [targetColumnId]: sortCardsByPriority(targetCards, targetColumnId),
    },
    rollbackCompletedCardId,
  };
}

export function useTodoBoard() {
  const [state, setState] = useState<TodoState>(() => initializeTodoState());

  useEffect(() => {
    saveTodoBoardState(state.board);
  }, [state.board]);

  useEffect(() => {
    saveTodoOutcomeMap(state.outcomes);
  }, [state.outcomes]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setState((currentState) => pruneState(currentState, Date.now()));
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
      failedAt: undefined,
    };

    setState((currentState) => {
      const safeState = pruneState(currentState, Date.now());
      const nextCards = sortCardsByPriority([nextCard, ...safeState.board[DEFAULT_TODO_COLUMN_ID]], DEFAULT_TODO_COLUMN_ID);

      return {
        ...safeState,
        board: {
          ...safeState.board,
          [DEFAULT_TODO_COLUMN_ID]: nextCards,
        },
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
      failedAt: undefined,
    };

    setState((currentState) => {
      const safeState = pruneState(currentState, Date.now());
      const nextCards = sortCardsByPriority([nextNote, ...safeState.board[NOTES_COLUMN_ID]], NOTES_COLUMN_ID);

      return {
        ...safeState,
        board: {
          ...safeState.board,
          [NOTES_COLUMN_ID]: nextCards,
        },
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

    setState((currentState) => {
      const safeState = pruneState(currentState, Date.now());
      const location = findCardLocation(safeState.board, cardId);

      if (!location) {
        return safeState;
      }

      const nextCards = safeState.board[location.columnId].map((card) => {
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
        ...safeState,
        board: {
          ...safeState.board,
          [location.columnId]: sortCardsByPriority(nextCards, location.columnId),
        },
      };
    });

    return true;
  }, []);

  const moveCard = useCallback(
    (cardId: string, targetColumnId: TodoColumnId): void => {
      setState((currentState) => {
        const now = Date.now();
        const safeState = pruneState(currentState, now);
        const { board, outcomeEvent, rollbackCompletedCardId } = moveCardInState(safeState.board, cardId, targetColumnId, now);
        let nextOutcomes = outcomeEvent ? applyOutcomeEvent(safeState.outcomes, outcomeEvent) : safeState.outcomes;

        if (rollbackCompletedCardId) {
          nextOutcomes = removeCompletedOutcome(nextOutcomes, rollbackCompletedCardId);
        }

        return {
          board,
          outcomes: nextOutcomes,
        };
      });
    },
    []
  );

  const deleteCard = useCallback((cardId: string): void => {
    setState((currentState) => {
      const safeState = pruneState(currentState, Date.now());
      const location = findCardLocation(safeState.board, cardId);

      if (!location) {
        return safeState;
      }

      const nextCards = safeState.board[location.columnId].filter((card) => card.id !== cardId);

      return {
        ...safeState,
        board: {
          ...safeState.board,
          [location.columnId]: sortCardsByPriority(nextCards, location.columnId),
        },
      };
    });
  }, []);

  const getCardById = useCallback(
    (cardId: string): TodoCard | null => {
      return findCardById(state.board, cardId);
    },
    [state.board]
  );

  return {
    board: state.board,
    outcomes: state.outcomes,
    addCard,
    addNote,
    updateCard,
    moveCard,
    deleteCard,
    getCardById,
  };
}
