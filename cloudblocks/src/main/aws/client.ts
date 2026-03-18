import { EC2Client } from '@aws-sdk/client-ec2'
import { RDSClient } from '@aws-sdk/client-rds'
import { S3Client } from '@aws-sdk/client-s3'
import { LambdaClient } from '@aws-sdk/client-lambda'
import { ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2'
import { ACMClient } from '@aws-sdk/client-acm'
import { CloudFrontClient } from '@aws-sdk/client-cloudfront'

export interface AwsClients {
  ec2: EC2Client
  rds: RDSClient
  s3: S3Client
  lambda: LambdaClient
  alb: ElasticLoadBalancingV2Client
  acm: ACMClient
  cloudfront: CloudFrontClient
}

// Creates a fresh set of AWS SDK clients for the given profile + region.
export function createClients(profile: string, region: string): AwsClients {
  const config = { region }

  // Set AWS_PROFILE so the SDK credential provider picks up the right profile.
  process.env.AWS_PROFILE = profile
  process.env.AWS_REGION = region

  return {
    ec2:        new EC2Client(config),
    rds:        new RDSClient(config),
    s3:         new S3Client(config),
    lambda:     new LambdaClient(config),
    alb:        new ElasticLoadBalancingV2Client(config),
    // ACM for CloudFront must always use us-east-1
    acm:        new ACMClient({ region: 'us-east-1' }),
    cloudfront: new CloudFrontClient(config),
  }
}
