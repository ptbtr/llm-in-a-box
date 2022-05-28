import { Deployment } from "kubernetes-types/apps/v1";
import { Namespace, Service } from "kubernetes-types/core/v1";
import * as yaml from "yaml";

export type Manifests = {
  server: ServiceDeployment;
  worker: Deployment;
  redis: ServiceDeployment;
  namespace: Namespace;
};

export type ServiceDeployment = { service: Service; deployment: Deployment };

type Env = "prod" | "dev";

const LLMInABoxImage = "llm-in-a-box";

/** Get the manifests as a javascript object */
export const manifests = (environment: Env, numWorkers = 1): Manifests => {
  const serverLabels = { app: "server" };
  const serverPort = 8000;
  const workerLabels = { app: "worker" };
  const redisLabels = { app: "redis" };
  const redisPort = 6379;

  return {
    namespace: {
      apiVersion: "v1",
      kind: "Namespace",
      metadata: {
        name: "llm-in-a-box",
      },
    },
    server: {
      deployment: serverDeployment(serverLabels, serverPort, environment),
      service: serverService(serverLabels, serverPort, environment),
    },
    worker: workerDeployment(workerLabels, environment, numWorkers),
    redis: {
      deployment: redisDeployment(redisLabels, redisPort),
      service: redisService(redisLabels, redisPort),
    },
  };
};

/** Dump the manifests as a string */
export const renderManifests = (manifests: Manifests): string => {
  return [
    manifests.namespace,
    manifests.server.deployment,
    manifests.server.service,
    manifests.worker,
    manifests.redis.deployment,
    manifests.redis.service,
  ]
    .map((x) => yaml.stringify(x, { aliasDuplicateObjects: false }))
    .join("---\n");
};

const serverService = (
  serverLabels: { app: string },
  serverPort: number,
  environment: Env
): Service => {
  return {
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      name: serverLabels.app,
    },
    spec: {
      selector: serverLabels,
      ports: [
        {
          name: "http",
          port: environment === "prod" ? 80 : serverPort,
          targetPort: serverPort,
        },
      ],
    },
  };
};

const serverDeployment = (
  serverLabels: { app: string },
  serverPort: number,
  environment: Env
): Deployment => {
  return {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: serverLabels.app,
      labels: serverLabels,
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: serverLabels,
      },
      template: {
        metadata: {
          labels: serverLabels,
        },
        spec: {
          containers: [
            {
              name: serverLabels.app,
              image: `${LLMInABoxImage}:${environment}`,
              ports: [
                {
                  containerPort: serverPort,
                },
              ],
              command: [
                "uvicorn",
                "server.main:app",
                "--host=0.0.0.0",
                `--port=${serverPort}`,
              ],
              env: [envVar("ENV", environment)],
            },
          ],
        },
      },
    },
  };
};

const workerDeployment = (
  workerLabels: { app: string },
  environment: Env,
  numWorkers: number
): Deployment => {
  const appName = "worker";
  return {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: appName,
      labels: workerLabels,
    },
    spec: {
      replicas: numWorkers,
      selector: {
        matchLabels: workerLabels,
      },
      template: {
        metadata: {
          labels: workerLabels,
        },
        spec: {
          containers: [
            {
              name: appName,
              image: `${LLMInABoxImage}:${environment}`,
              volumeMounts: [
                {
                  name: "transformers-cache",
                  mountPath: "/transformers-cache",
                },
              ],
              command: [
                "celery",
                "--app=worker.tasks:app",
                "worker",
                "--loglevel=INFO",
                "--concurrency=1",
              ],
              env: [envVar("ENV", environment)],
            },
          ],
          volumes: [
            {
              name: "transformers-cache",
              emptyDir: {},
            },
          ],
        },
      },
    },
  };
};

const redisDeployment = (
  redisLabels: { app: string },
  redisPort: number
): Deployment => {
  const name = "redis";
  const redisImage = "redis";
  return {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name,
      labels: redisLabels,
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: redisLabels,
      },
      template: {
        metadata: {
          labels: redisLabels,
        },
        spec: {
          containers: [
            {
              name,
              image: redisImage,
              ports: [
                {
                  containerPort: redisPort,
                },
              ],
            },
          ],
        },
      },
    },
  };
};

const redisService = (
  redisLabels: { app: string },
  redisPort: number
): Service => {
  const name = "redis";
  return {
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      name,
    },
    spec: {
      selector: redisLabels,
      ports: [
        {
          name: "http",
          port: redisPort,
          targetPort: redisPort,
        },
      ],
    },
  };
};

const envVar = (
  name: string,
  value: number | string
): { name: string; value: string } => {
  return { name: name, value: value.toString() };
};
