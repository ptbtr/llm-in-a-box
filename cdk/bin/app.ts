#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ClusterStack,  QueueProcessingStack} from '../lib/app-stack';

const app = new cdk.App();
const clusterStack = new ClusterStack(app, 'ClusterStack');
const queueProcessingStack = new QueueProcessingStack(app, 'QueueProcessingStack', {
  cluster: clusterStack,
});
