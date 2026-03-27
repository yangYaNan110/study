function buildTask(content, existingTasks = []) {
  const now = new Date().toISOString();

  return {
    id: String(getNextTaskId(existingTasks)),
    content: content.trim(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
}

function getNextTaskId(existingTasks) {
  return existingTasks.reduce((maxId, task) => {
    const numericId = Number(task.id);
    return Number.isInteger(numericId) && numericId > maxId ? numericId : maxId;
  }, 0) + 1;
}

module.exports = {
  buildTask,
};
