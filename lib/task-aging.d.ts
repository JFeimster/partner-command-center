export type AgingTask = { status: string; due_at?: string | null; created_at?: string | null; [key: string]: unknown };
export function taskUrgency(task: AgingTask, now?: Date): "overdue" | "due today" | "upcoming" | "no due date" | "completed";
export function prioritizeTasks<T extends AgingTask>(tasks: T[]): Array<T & { urgency: ReturnType<typeof taskUrgency> }>;
