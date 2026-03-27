const fs = require("node:fs/promises");

const {
  DATA_DIRECTORY,
  DATA_FILE_PATH,
} = require("../config/constants");
const { ensureArrayData } = require("../utils/validator");

async function ensureStorageFile() {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });

  try {
    await fs.access(DATA_FILE_PATH);
  } catch {
    await fs.writeFile(DATA_FILE_PATH, "[]\n", "utf8");
  }
}

async function readTasks() {
  await ensureStorageFile();

  const raw = await fs.readFile(DATA_FILE_PATH, "utf8");

  try {
    const tasks = JSON.parse(raw);
    ensureArrayData(tasks);
    return tasks;
  } catch (error) {
    throw new Error(`Failed to read task data: ${error.message}`);
  }
}

async function writeTasks(tasks) {
  ensureArrayData(tasks);
  await ensureStorageFile();
  await fs.writeFile(DATA_FILE_PATH, `${JSON.stringify(tasks, null, 2)}\n`, "utf8");
}

module.exports = {
  ensureStorageFile,
  readTasks,
  writeTasks,
};
