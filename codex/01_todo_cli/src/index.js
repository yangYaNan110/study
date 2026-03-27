const { handleAdd } = require("./commands/add");
const { handleList } = require("./commands/list");
const { handleDone } = require("./commands/done");
const { handleRemove } = require("./commands/remove");
const { formatHelp } = require("./utils/formatter");

const commandHandlers = {
  add: handleAdd,
  list: handleList,
  done: handleDone,
  remove: handleRemove,
};

async function run(argv = []) {
  const [command, ...args] = argv;

  if (!command || command === "--help" || command === "-h") {
    console.log(formatHelp());
    return;
  }

  const handler = commandHandlers[command];

  if (!handler) {
    throw new Error(`Unknown command: ${command}\n\n${formatHelp()}`);
  }

  const output = await handler(args);

  if (output) {
    console.log(output);
  }
}

module.exports = {
  run,
};
