import {
  DEFAULT_TODO_CATEGORY,
  DEFAULT_TODO_PRIORITY,
  TODO_COLUMN_IDS,
  type TodoBoardState,
  type TodoCategory,
  type TodoCard,
  type TodoPriority,
} from "../types";

const TODO_BOARD_STORAGE_KEY = "selfos.todo.board.v1";
const NOTE_DUE_DATE_FALLBACK = "9999-12-31";
const LEGACY_THREE_COLUMN_IDS = ["todo", "in-progress", "done"] as const;
const LEGACY_WEEKLY_COLUMN_IDS = [
  "in-progress",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "done",
] as const;

function isTodoPriority(value: unknown): value is TodoPriority {
  return value === "high" || value === "medium" || value === "low";
}

function isTodoCategory(value: unknown): value is TodoCategory {
  return (
    value === "book" ||
    value === "sports" ||
    value === "exam" ||
    value === "project" ||
    value === "personal" ||
    value === "general"
  );
}

function parseTodoCard(value: unknown): TodoCard | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const description = typeof candidate.description === "string" ? candidate.description : "";
  const priority = isTodoPriority(candidate.priority) ? candidate.priority : DEFAULT_TODO_PRIORITY;
  const category = isTodoCategory(candidate.category) ? candidate.category : DEFAULT_TODO_CATEGORY;
  const dueDate =
    typeof candidate.dueDate === "string" && candidate.dueDate
      ? candidate.dueDate
      : new Date((typeof candidate.createdAt === "number" ? candidate.createdAt : Date.now()) + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
  const isNote =
    candidate.isNote === true ||
    (candidate.isNote === undefined && typeof candidate.dueDate === "string" && candidate.dueDate === NOTE_DUE_DATE_FALLBACK);
  const completedAt = typeof candidate.completedAt === "number" ? candidate.completedAt : undefined;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.createdAt !== "number"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    title: candidate.title,
    description,
    priority,
    category,
    dueDate,
    createdAt: candidate.createdAt,
    isNote,
    completedAt,
  };
}

function normalizeWeeklyBoardState(value: unknown): TodoBoardState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const normalizedState = createEmptyTodoBoardState();

  for (const columnId of TODO_COLUMN_IDS) {
    const cards = candidate[columnId];

    if (!Array.isArray(cards)) {
      return null;
    }

    normalizedState[columnId] = cards
      .map((cardValue) => parseTodoCard(cardValue))
      .filter((card): card is TodoCard => card !== null);
  }

  return normalizedState;
}

function normalizeLegacyBoardState(value: unknown): TodoBoardState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  for (const columnId of LEGACY_THREE_COLUMN_IDS) {
    if (!Array.isArray(candidate[columnId])) {
      return null;
    }
  }

  const parsedTodo = (candidate.todo as unknown[])
    .map((cardValue) => parseTodoCard(cardValue))
    .filter((card): card is TodoCard => card !== null);

  const parsedInProgress = (candidate["in-progress"] as unknown[])
    .map((cardValue) => parseTodoCard(cardValue))
    .filter((card): card is TodoCard => card !== null);

  const parsedDone = (candidate.done as unknown[])
    .map((cardValue) => parseTodoCard(cardValue))
    .filter((card): card is TodoCard => card !== null);

  return {
    ...createEmptyTodoBoardState(),
    todo: parsedTodo,
    "in-progress": parsedInProgress,
    done: parsedDone,
  };
}

function normalizeLegacyWeeklyBoardState(value: unknown): TodoBoardState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  for (const columnId of LEGACY_WEEKLY_COLUMN_IDS) {
    if (!Array.isArray(candidate[columnId])) {
      return null;
    }
  }

  const allWeeklyCards = LEGACY_WEEKLY_COLUMN_IDS.filter((columnId) => columnId !== "in-progress" && columnId !== "done")
    .flatMap((columnId) => candidate[columnId] as unknown[])
    .map((cardValue) => parseTodoCard(cardValue))
    .filter((card): card is TodoCard => card !== null);

  const parsedInProgress = (candidate["in-progress"] as unknown[])
    .map((cardValue) => parseTodoCard(cardValue))
    .filter((card): card is TodoCard => card !== null);

  const parsedDone = (candidate.done as unknown[])
    .map((cardValue) => parseTodoCard(cardValue))
    .filter((card): card is TodoCard => card !== null);

  return {
    ...createEmptyTodoBoardState(),
    todo: allWeeklyCards,
    "in-progress": parsedInProgress,
    done: parsedDone,
  };
}

export function createEmptyTodoBoardState(): TodoBoardState {
  return {
    "in-progress": [],
    todo: [],
    notes: [],
    done: [],
  };
}

export function loadTodoBoardState(): TodoBoardState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(TODO_BOARD_STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    return (
      normalizeWeeklyBoardState(parsedValue) ??
      normalizeLegacyBoardState(parsedValue) ??
      normalizeLegacyWeeklyBoardState(parsedValue)
    );
  } catch {
    return null;
  }
}

export function saveTodoBoardState(state: TodoBoardState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(TODO_BOARD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Intentionally ignore write failures (private mode/quota errors).
  }
}
