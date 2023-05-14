#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';

/* Configurations */
const app = new App();
const appName = app.node.tryGetContext('app-name');
const vpcCidr = app.node.tryGetContext('vpc-cidr');
const rdsSnapshotIdentifier = app.node.tryGetContext('rds-snapshot-identifier');

if (appName == null || appName == '') {
  throw new Error('Must specify app name: -c app-name=my-web-app');
}
if (vpcCidr == null || vpcCidr == '') {
  throw new Error('Must specify VPC CIDR: -c vpc-cidr=192.168.0.0/24');
}

/* Stacks */
new InfraStack(app, 'InfraStack', {
  stackName: appName,
  vpcCidr: vpcCidr,
  rdsSnapshotIdentifier: rdsSnapshotIdentifier,
});
