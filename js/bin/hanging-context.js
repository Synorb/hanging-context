#!/usr/bin/env node
import { main, reportError } from "../src/cli.js";

main(process.argv.slice(2)).catch((err) => {
  reportError(err);
  process.exit(1);
});
