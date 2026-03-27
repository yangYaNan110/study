#!/usr/bin/env node

const { run } = require("../src");

run(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
