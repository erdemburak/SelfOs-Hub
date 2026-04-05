"use client";

import dynamic from "next/dynamic";

const TodoBoard = dynamic(() => import("./todo-board").then((module) => module.TodoBoard), {
  ssr: false,
});

export function TodoPageClient() {
  return <TodoBoard />;
}
