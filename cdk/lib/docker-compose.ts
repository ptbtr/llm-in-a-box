import * as t from "io-ts";
import { parse as yamlParse } from "yaml";
import * as fs from "fs";
import execa = require("execa");
import { unwrapOrRaise } from "./util";

export const Service = t.partial({
  image: t.string,
  build: t.type({
    context: t.string,
    target: t.string,
  }),
  command: t.array(t.string),
  ports: t.array(t.string),
  volumes: t.array(t.string),
  environment: t.array(t.string),
});

export type Service = t.TypeOf<typeof Service>;

export const VolumeSpec = t.type({
});

export type VolumeSpec = t.TypeOf<typeof VolumeSpec>;

export const DockerCompose = t.type({
  services: t.record(t.string, Service),
  volumes: t.record(t.string, VolumeSpec),
});

export type DockerCompose = t.TypeOf<typeof DockerCompose>;

export const loadDockerCompose = (filename: string): DockerCompose => {
    const rawString = fs.readFileSync(filename, 'utf8');
    const yamled = yamlParse(rawString);
    return unwrapOrRaise(DockerCompose.decode(yamled), `failed to parse ${filename}`);
}

export interface DockerComposeBuildOptions {
    dockerComposeFile: string;
    buildDir: string;
    imageName: string;
    tag: string;
}

export const dockerComposeBuild = async ({ dockerComposeFile, buildDir, imageName, tag }: DockerComposeBuildOptions ): Promise<string> => {
    const outFile = `${buildDir}/${imageName}.${tag}.tar`;
    // build the llm-in-a-box:dev image
    console.log(`Building ${imageName}:${tag} image`);
    await execa('docker-compose', [
        '-f', dockerComposeFile,
        'build',
    ]);
    console.log(`Exporting it to ${outFile}`);
    await execa('docker', [
        'save',
        '-o', outFile,
        `${imageName}:${tag}`,
    ]);
    return outFile;
};

