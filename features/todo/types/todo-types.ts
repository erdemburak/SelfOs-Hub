export const TODO_COLUMN_IDS = ["in-progress", "todo", "notes", "done"] as const;

export type TodoColumnId = (typeof TODO_COLUMN_IDS)[number];

export type TodoPriority = "high" | "medium" | "low";
export type TodoCategory = "book" | "sports" | "exam" | "project" | "personal" | "general";

export type TodoColumnTone = "default" | "in-progress" | "done";

export type TodoColumn = {
  id: TodoColumnId;
  title: string;
  tone: TodoColumnTone;
};

export type TodoCard = {
  id: string;
  title: string;
  description: string;
  priority: TodoPriority;
  category: TodoCategory;
  dueDate: string;
  createdAt: number;
  isNote: boolean;
  completedAt?: number;
};

export type TodoBoardState = Record<TodoColumnId, TodoCard[]>;

export type TodoCardDraft = {
  title: string;
  description: string;
  priority: TodoPriority;
  category: TodoCategory;
  dueDate: string;
};

export type TodoCardUpdate = {
  title: string;
  description: string;
  priority: TodoPriority;
  category: TodoCategory;
  dueDate: string;
};

export type TodoNoteDraft = {
  title: string;
  description: string;
};

export type TodoDragData =
  | {
      type: "card";
      cardId: string;
      columnId: TodoColumnId;
    }
  | {
      type: "column";
      columnId: TodoColumnId;
    };

export const TODO_PRIORITY_OPTIONS: Array<{ value: TodoPriority; label: string }> = [
  { value: "high", label: "Yüksek" },
  { value: "medium", label: "Orta" },
  { value: "low", label: "Düşük" },
];

export const TODO_CATEGORY_OPTIONS: Array<{ value: TodoCategory; label: string }> = [
  { value: "book", label: "Kitap" },
  { value: "sports", label: "Spor" },
  { value: "exam", label: "Sınav" },
  { value: "project", label: "Proje" },
  { value: "personal", label: "Personal" },
  { value: "general", label: "Genel" },
];

export const TODO_COLUMNS: TodoColumn[] = [
  { id: "in-progress", title: "Devam Edenler", tone: "in-progress" },
  { id: "todo", title: "Yapılacaklar", tone: "default" },
  { id: "notes", title: "Notlar", tone: "default" },
  { id: "done", title: "Tamamlananlar", tone: "done" },
];

export const DEFAULT_TODO_COLUMN_ID: TodoColumnId = "todo";
export const DEFAULT_TODO_PRIORITY: TodoPriority = "medium";
export const DEFAULT_TODO_CATEGORY: TodoCategory = "general";
