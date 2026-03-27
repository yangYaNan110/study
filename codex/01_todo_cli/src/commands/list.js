const { listTasks } = require("../services/taskService");
const { formatTaskList } = require("../utils/formatter");

async function handleList() {
  const tasks = await listTasks();
  return formatTaskList(tasks);
}

module.exports = {
  handleList,
};
