const { markTaskDone } = require("../services/taskService");

async function handleDone(args) {
  const [taskId] = args;
  const task = await markTaskDone(taskId);
  return `Marked task [${task.id}] as done.`;
}

module.exports = {
  handleDone,
};
