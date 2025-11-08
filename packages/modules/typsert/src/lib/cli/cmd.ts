import { Command } from "commander";

const TypeAssertionCLI = new Command("typsert");

TypeAssertionCLI.description("typsert is a type-level testing CLI").option(
  "-t, --ts-config <TSCONFIG_PATH>",
  "Path to tsconfig.json"
);

export { TypeAssertionCLI };
