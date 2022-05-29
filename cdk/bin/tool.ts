#!/usr/bin/env -S ts-node --transpile-only --script-mode

import { renderManifests, manifests } from "../lib/manifests";
import yargs from "yargs";
import * as fs from "fs";

/** Parse command line options and run the command */
const main = async () => {
  yargs.usage("npx tool <command> [args]").command(
    "render <ENV> <PATH>",
    "Render the k8s manifests for the given environment",
    (yargs) =>
      yargs
        .positional("ENV", {
          alias: "e",
          choices: ["dev", "prod"] as const,
          demandOption: true,
          description: "The environment to render for",
        })
        .positional("PATH", {
          alias: "p",
          demandOption: true,
          type: "string",
          description: "The path to write the rendered manifests to",
        })
        .option("numWorkers", {
          alias: "n",
          default: 1,
          description: "The number of workers to use",
          type: "number",
        }),
    async (args) => manifestCommand(args.ENV, args.PATH, args.numWorkers)
  ).argv;
};

const manifestCommand = (
  env: "prod" | "dev",
  outputPath: string,
  numWorkers: number
) => {
  const output = renderManifests(manifests(env, numWorkers));
  fs.writeFileSync(outputPath, output);
};

main();
