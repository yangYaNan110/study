const path = require("node:path");

const ROOT_DIRECTORY = path.resolve(__dirname, "../..");
const DATA_DIRECTORY = path.join(ROOT_DIRECTORY, "data");
const DATA_FILE_PATH = path.join(DATA_DIRECTORY, "tasks.json");

module.exports = {
  ROOT_DIRECTORY,
  DATA_DIRECTORY,
  DATA_FILE_PATH,
};
