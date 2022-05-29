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
      natGateways: 0,
    });

    this.cluster = new eks.Cluster(this, "Cluster", {
      version: eks.KubernetesVersion.V1_21,
      vpc: this.vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PUBLIC }],
      clusterName: "llm-in-a-box",
      defaultCapacity: 0,
    });
    const instanceTypes = [
      ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
    ];
    if (props.useSpotInstances) {
      instanceTypes.push(
        ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
        ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)
      );
    }

    this.cluster.addNodegroupCapacity("custom-node-group", {
      instanceTypes,
      minSize: props.numWorkers,
      maxSize: props.numWorkers,
      amiType: eks.NodegroupAmiType.BOTTLEROCKET_X86_64,
      subnets: this.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PUBLIC,
      }),
      capacityType: props.useSpotInstances
        ? eks.CapacityType.SPOT
        : eks.CapacityType.ON_DEMAND,
    });

    this.manifests = manifests("prod", props.numWorkers);

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
