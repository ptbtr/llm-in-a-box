import * as apps from "kubernetes-types/apps/v1";
import * as core from "kubernetes-types/core/v1";
import * as yaml from "yaml";

export type Manifests = {
  server: ServiceDeployment;
  worker: Deployment;
  redis: ServiceDeployment;
  namespace: Namespace;
};

type Service = core.Service & { metadata: { labels: { app: string } } };
type Deployment = apps.Deployment & {
  metadata: {
    labels: { app: string };
  };
};
type Namespace = core.Namespace & { metadata: { name: string } };

export type ServiceDeployment = { service: Service; deployment: Deployment };

type Env = "prod" | "dev";

const LLM_IN_A_BOX_IMAGE = "llm-in-a-box";
const LLM_NAMESPACE = "llm-in-a-box";

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
        name: LLM_NAMESPACE,
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
      namespace: LLM_NAMESPACE,
      labels: serverLabels,
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
      namespace: LLM_NAMESPACE,
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
              image: `${LLM_IN_A_BOX_IMAGE}:${environment}`,
              ports: [
                {
                  containerPort: serverPort,
                },
              ],
              resources: {
                requests: {
                  cpu: "250m",
                  memory: "500Mi",
                },
              },
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
      namespace: LLM_NAMESPACE,
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
          tolerations: [
            {
              key: "llm-in-a-box/worker",
              effect: "NoSchedule",
              value: "true",
            },
          ],
          containers: [
            {
              name: appName,
              image: `${LLM_IN_A_BOX_IMAGE}:${environment}`,
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
      namespace: LLM_NAMESPACE,
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
      namespace: LLM_NAMESPACE,
      labels: redisLabels,
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
