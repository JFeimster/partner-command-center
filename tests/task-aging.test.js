"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { taskUrgency, prioritizeTasks } = require("../lib/task-aging");

const now = new Date("2026-10-23T16:00:00.000Z");

test("operator task urgency uses Eastern calendar dates and ignores completed due dates", () => {
  assert.equal(taskUrgency({ status: "open", due_at: "2026-10-22T12:00:00.000Z" }, now), "overdue");
  assert.equal(taskUrgency({ status: "open", due_at: "2026-10-23T12:00:00.000Z" }, now), "due today");
  assert.equal(taskUrgency({ status: "open", due_at: null }, now), "no due date");
  assert.equal(taskUrgency({ status: "completed", due_at: "2026-10-01T12:00:00.000Z" }, now), "completed");
});

test("operator task urgency sorts overdue work first without changing record status", () => {
  const tasks = prioritizeTasks([
    { id: "later", status: "open", due_at: "2026-10-24T12:00:00.000Z" },
    { id: "late", status: "open", due_at: "2026-10-20T12:00:00.000Z" },
    { id: "done", status: "completed", due_at: "2026-10-01T12:00:00.000Z" }
  ]);
  assert.deepEqual(tasks.map((task) => task.id), ["late", "later", "done"]);
  assert.equal(tasks[0].status, "open");
});
