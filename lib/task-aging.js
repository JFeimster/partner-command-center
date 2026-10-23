"use strict";

function taskUrgency(task, now = new Date()) {
  if (task.status !== "open") return "completed";
  if (!task.due_at) return "no due date";
  const dueDate = String(task.due_at).slice(0, 10);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return "no due date";
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "due today";
  return "upcoming";
}

function prioritizeTasks(tasks) {
  const rank = { overdue: 0, "due today": 1, upcoming: 2, "no due date": 3, completed: 4 };
  return tasks.map((task) => ({ ...task, urgency: taskUrgency(task) }))
    .sort((a, b) => rank[a.urgency] - rank[b.urgency] ||
      (a.due_at || "9999-12-31").localeCompare(b.due_at || "9999-12-31") ||
      (a.created_at || "").localeCompare(b.created_at || ""));
}

module.exports = { taskUrgency, prioritizeTasks };
