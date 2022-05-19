import { Stack, StackProps, aws_ecs_patterns as ecsPatterns, aws_ecs as ecs } from "aws-cdk-lib";
import { Construct } from "constructs";

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const loadBalancedEcsService = new ecsPatterns.ApplicationLoadBalancedEc2Service(this, 'Service', {
      memoryLimitMiB: 1024,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(`${__dirname}/../../app`, {
        }),
        environment: {
          "FOO": "BAR",
        },
      },
      desiredCount: 3,
    });
  }
}