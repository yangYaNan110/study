const { removeTask } = require("../services/taskService");

async function handleRemove(args) {
  const [taskId] = args;
  const task = await removeTask(taskId);
  return `Removed task [${task.id}]: ${task.content}`;
}

module.exports = {
  handleRemove,
};
