import {
  CfnOutput,
  Stack,
  StackProps,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_rds as rds,
} from 'aws-cdk-lib';
import {
  CfnDBInstance,
  CfnDBParameterGroup,
  CfnDBSubnetGroup,
} from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

type InfraStackProps = StackProps & {
  vpcCidr: string;
  rdsSnapshotIdentifier?: string;
};

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    /* Resources */
    // VPC
    const vpc = new ec2.Vpc(this, 'vpc', {
      ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr),
      vpcName: `${props.stackName}-vpc`,
    });
    // EC2
    const securityGroup = new ec2.SecurityGroup(this, 'ec2-secgroup', {
      vpc: vpc,
      securityGroupName: `${props.stackName}-ec2`,
    });
    const instanceRole = new iam.Role(this, 'ec2-instance-role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      description: `${props.stackName}-ec2-instance-role`,
    });
    const ec2Instance = new ec2.Instance(this, 'ec2-instance', {
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: securityGroup,
      role: instanceRole,
      instanceName: `${props.stackName}-ec2`,
    });
    // RDS
    const rdsInstance = new rds.DatabaseInstance(this, 'rds-instance', {
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }),
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_32,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      databaseName: 'testdb',
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
    });

    /* Outputs */
    new CfnOutput(this, 'VPC', { value: vpc.vpcId });
    new CfnOutput(this, 'SecurityGroup', {
      value: securityGroup.securityGroupId,
    });
    new CfnOutput(this, 'EC2Instance', { value: ec2Instance.instanceId });
    new CfnOutput(this, 'RDSInstance', { value: rdsInstance.instanceArn });
  }
}
