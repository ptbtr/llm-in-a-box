#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ClusterStack } from "../lib/app-stack";
import { dockerComposeBuild, loadDockerCompose } from "../lib/docker-compose";
import * as t from "io-ts";
import { unwrapOrRaise } from "../lib/util";
import * as path from "path";

const rootDir = path.resolve(__dirname, "..", "..");
const appDir = path.resolve(rootDir, "app");
const buildDir = path.resolve(rootDir, "build");
const dockerComposeFile = path.resolve(appDir, "docker-compose.yml");

async function main(): Promise<cdk.App> {
  const app = new cdk.App();

  const dc = loadDockerCompose(dockerComposeFile);
  const imageName = unwrapOrRaise(
    t.string.decode(dc.services["production-image"].image),
    `image name not found in docker-compose.yml`
  ).split(":")[0];
  const tag = unwrapOrRaise(
    t.string.decode(dc.services["production-image"].build?.target),
    "tag not found in docker-compose.yml"
  );
  const imageTar = await dockerComposeBuild({
    dockerComposeFile,
    buildDir,
    imageName,
    tag,
  });

  const clusterStack = new ClusterStack(app, "ClusterStack", {
    useSpotInstances: false,
    numWorkers: 1,
  });

  return app;
}

main();
