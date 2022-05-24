import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';
import { IntOrString, KubeDeployment, KubeService } from './imports/k8s';

export class MyChart extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = { }) {
    super(scope, id, props);

    const label = { app: 'web' }

    new KubeService(this, 'service', {
      spec: {
        type: 'LoadBalancer',
        ports: [ { port: 80, targetPort: IntOrString.fromNumber(8080) } ],
        selector: label,
      }
    });

    new KubeDeployment(this, 'deployment', {
      spec: {
        selector: { matchLabels: label },
        template: {
          metadata: { labels: label },
          spec: {
            containers: [
              {
                name: "server",
                image: "llm-in-a-box:prod",
                ports: [ { containerPort: 8080 } ],
              },
            ]
          }
        }
      },
    });
  }
}

const app = new App();
new MyChart(app, 'llm-in-a-box');
app.synth();
