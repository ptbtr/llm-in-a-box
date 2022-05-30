import { Stack, StackProps, aws_eks as eks, aws_ec2 as ec2 } from "aws-cdk-lib";
import { Construct } from "constructs";
import { manifests, Manifests } from "./manifests";

export interface ClusterProps extends StackProps {
  useSpotInstances?: boolean;
  numWorkers?: number;
}

export class ClusterStack extends Stack {
  readonly vpc: ec2.Vpc;
  readonly cluster: eks.Cluster;
  readonly manifests: Manifests;

  constructor(scope: Construct, id: string, props: ClusterProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "VPC", {
      maxAzs: 2,
      natGateways: 1,
    });

    this.cluster = new eks.Cluster(this, "Cluster", {
      version: eks.KubernetesVersion.V1_21,
      vpc: this.vpc,
      clusterName: "llm-in-a-box",
      defaultCapacity: 0,
    });
    const instanceTypes = [
      ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
    ];
    if (props.useSpotInstances) {
      instanceTypes.push(
        ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)
      );
    }

    this.manifests = manifests(props.numWorkers);

    const workerToleration =
      this.manifests.worker.statefulset.spec?.template.spec?.tolerations?.[0];

    this.cluster.addNodegroupCapacity("worker-node-group", {
      instanceTypes,
      minSize: props.numWorkers,
      maxSize: props.numWorkers,
      amiType: eks.NodegroupAmiType.BOTTLEROCKET_X86_64,
      taints: [
        {
          key: workerToleration?.key || "",
          value: workerToleration?.value || "",
          effect: eks.TaintEffect.PREFER_NO_SCHEDULE,
        },
      ],
      capacityType: props.useSpotInstances
        ? eks.CapacityType.SPOT
        : eks.CapacityType.ON_DEMAND,
    });

    this.cluster.addFargateProfile("server-fargate-profile", {
      fargateProfileName: "llm-server-profile",
      selectors: [
        {
          namespace: this.manifests.namespace.metadata.name,
          labels: this.manifests.server.deployment.metadata.labels,
        },
      ],
    });
    this.cluster.addFargateProfile("redis-fargate-profile", {
      fargateProfileName: "llm-redis-profile",
      selectors: [
        {
          namespace: this.manifests.namespace.metadata.name,
          labels: this.manifests.redis.deployment.metadata.labels,
        },
      ],
    });

    this.cluster.addManifest(
      "Manifests",
      this.manifests.namespace,
      this.manifests.server.deployment,
      this.manifests.server.service,
      this.manifests.worker,
      this.manifests.redis.deployment,
      this.manifests.redis.service
    );
  }
}
