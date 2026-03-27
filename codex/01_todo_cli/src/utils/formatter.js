function formatTaskList(tasks) {
  if (!tasks.length) {
    return "No tasks found.";
  }

  return tasks
    .map((task) => {
      const status = task.status === "done" ? "[x]" : "[ ]";
      return `${status} ${task.id}. ${task.content}`;
    })
    .join("\n");
}

function formatHelp() {
  return [
    "todo-cli commands:",
    "  todo add \"task content\"",
    "  todo list",
    "  todo done <taskId>",
    "  todo remove <taskId>",
  ].join("\n");
}

module.exports = {
  formatTaskList,
  formatHelp,
};
