const { buildTask } = require("../models/taskModel");
const {
  readTasks,
  writeTasks,
} = require("./storageService");
const {
  ensureTaskContent,
  ensureTaskId,
} = require("../utils/validator");

async function createTask(content) {
  ensureTaskContent(content);

  const tasks = await readTasks();
  const task = buildTask(content, tasks);

  tasks.push(task);
  await writeTasks(tasks);

  return task;
}

async function listTasks() {
  return readTasks();
}

async function markTaskDone(taskId) {
  ensureTaskId(taskId);

  const tasks = await readTasks();
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  if (task.status === "done") {
    throw new Error(`Task already completed: ${taskId}`);
  }

  task.status = "done";
  task.updatedAt = new Date().toISOString();

  await writeTasks(tasks);

  return task;
}

async function removeTask(taskId) {
  ensureTaskId(taskId);

  const tasks = await readTasks();
  const taskIndex = tasks.findIndex((item) => item.id === taskId);

  if (taskIndex === -1) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const [task] = tasks.splice(taskIndex, 1);
  await writeTasks(tasks);

  return task;
}

module.exports = {
  createTask,
  listTasks,
  markTaskDone,
  removeTask,
};
