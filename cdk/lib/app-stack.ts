import { Stack, StackProps, aws_eks as eks, aws_ec2 as ec2, aws_ecs as ecs, aws_ecs_patterns as ecsPatterns} from "aws-cdk-lib";
import { Construct } from "constructs";

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC");

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc: vpc,
    });

    const instanceType = ec2.InstanceType.of(ec2.InstanceClass.P2, ec2.InstanceSize.XLARGE);

    cluster.addCapacity("DefaultAutoScalingGroup", {
      instanceType,
      machineImage: new ecs.BottleRocketImage(),
      desiredCapacity: 1,
      spotInstanceDraining: true,
      spotPrice: "8.0",
    });

    const service = new ecsPatterns.QueueProcessingEc2Service(this, "QueueProcessingEc2Service", {
      cluster,
      memoryLimitMiB: 1024,
      image: ecs.ContainerImage.fromRegistry('test'),
      command: ["-c", "4", "amazon.com"],
      enableLogging: false,
      environment: {
      },
      gpuCount: 1,
      maxScalingCapacity: 1,
      containerName: 'gpu-worker',
    });

    // Next task definitions

  }
}