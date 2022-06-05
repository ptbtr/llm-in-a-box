#!/usr/bin/env -S ts-node --transpile-only --script-mode

import { renderManifests, manifests } from "../lib/manifests";
import yargs from "yargs";
import * as fs from "fs";

/** Parse command line options and run the command */
const main = async () => {
  yargs.usage("npx tool <command> [args]").command(
    "render <PATH>",
    "Render the k8s manifests for the given environment",
    (yargs) =>
      yargs
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
        })
        .option("useGpu", {
          alias: "g",
          default: false,
          description: "Use GPU instances",
          type: "boolean",
        }),
    async (args) => manifestCommand(args.PATH, args.numWorkers, args.useGpu)
  ).argv;
};

const manifestCommand = (
  outputPath: string,
  numWorkers: number,
  useGpu: boolean
) => {
  const output = renderManifests(manifests(numWorkers, useGpu));
  fs.writeFileSync(outputPath, output);
};

main();
