const { createTask } = require("../services/taskService");

async function handleAdd(args) {
  const content = args.join(" ");
  const task = await createTask(content);
  return `Added task [${task.id}]: ${task.content}`;
}

module.exports = {
  handleAdd,
};
