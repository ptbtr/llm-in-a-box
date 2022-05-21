import { Stack, StackProps,
  aws_eks as eks,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_ecs_patterns as ecsPatterns,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class ClusterStack extends Stack {
  readonly cluster: ecs.Cluster;
  readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "VPC", {
      maxAzs: 5,
      natGateways: 0,
    });

    this.cluster = new ecs.Cluster(this, "Cluster", {
      vpc: this.vpc,
    });

    this.cluster.addCapacity("p2.xlarge-ASG", {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.P2, ec2.InstanceSize.XLARGE),
      machineImage: new ecs.BottleRocketImage(),
      desiredCapacity: 1,
      spotInstanceDraining: true,
      spotPrice: "8.0",
    });
  }
}

export interface QueueProcessingProps extends StackProps {
  cluster: ClusterStack;
}

export class QueueProcessingStack extends Stack {
  readonly service: ecsPatterns.QueueProcessingEc2Service;
  constructor(scope: Construct, id: string, props: QueueProcessingProps) {
    super(scope, id, props);

    // this.service = new ecsPatterns.QueueProcessingEc2Service(this, "QueueProcessingEc2Service", {
    //   cluster: props.cluster.cluster,
    //   memoryLimitMiB: 1024,
    //   image: ecs.ContainerImage.fromRegistry('test'),
    //   command: ["-c", "4", "amazon.com"],
    //   enableLogging: false,
    //   environment: {
    //   },
    //   gpuCount: 1,
    //   maxScalingCapacity: 1,
    //   containerName: 'gpu-worker',
    // });
    // Next task definitions
  }
}