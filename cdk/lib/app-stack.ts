import { Stack, StackProps, aws_eks as eks, aws_ec2 as ec2 } from "aws-cdk-lib";
import { Construct } from "constructs";

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC");

    const cluster = new eks.Cluster(this, "Cluster", {
      vpc,
      version: eks.KubernetesVersion.V1_21,
      defaultCapacity: 0,
    });

    cluster.addNodegroupCapacity("gpu-nodes", {
      instanceTypes: [
        ec2.InstanceType.of(ec2.InstanceClass.P2, ec2.InstanceSize.XLARGE),
      ],
      minSize: 0,
      maxSize: 1,
      capacityType: eks.CapacityType.SPOT,
      taints: [
        {
          effect: eks.TaintEffect.NO_SCHEDULE,
          key: "requires-gpu",
          value: "true",
        }
      ]
    })
  }
}