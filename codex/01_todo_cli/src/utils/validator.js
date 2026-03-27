function ensureTaskContent(content) {
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("Task content is required.");
  }
}

function ensureTaskId(taskId) {
  if (typeof taskId !== "string" || taskId.trim() === "") {
    throw new Error("Task ID is required.");
  }
}

function ensureArrayData(value) {
  if (!Array.isArray(value)) {
    throw new Error("Task data must be an array.");
  }
}

module.exports = {
  ensureTaskContent,
  ensureTaskId,
  ensureArrayData,
};
