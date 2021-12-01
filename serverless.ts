import {authorizerFun, pullContracts, pullItems, queueCheck, scheduleCheck, updateExpiry} from './src/functions';

const serverlessConfiguration: any = {
  service: 'contracts-appraisal-v2',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    }
  },
  plugins: ['serverless-webpack', 'serverless-iam-roles-per-function'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    stage: '${env:STAGE, "dev"}',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    },
    lambdaHashingVersion: '20201221',
  },
  functions: { pullContracts, pullItems, authorizerFun, queueCheck, updateExpiry, scheduleCheck },
  resources: {
    Resources: {
      Table: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          KeySchema: [{
            AttributeName: 'pk',
            KeyType: 'HASH'
          }, {
            AttributeName: 'sk',
            KeyType: 'RANGE'
          }],
          AttributeDefinitions: [{
            AttributeName: 'pk',
            AttributeType: 'S'
          }, {
            AttributeName: 'sk',
            AttributeType: 'S'
          }],
          StreamSpecification: {
            StreamViewType: "NEW_IMAGE",
          }
        }
      },
      Queue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          RedrivePolicy: {
            deadLetterTargetArn: {'Fn::GetAtt': ['DLQ', 'Arn']},
            // retry up to 5 times
            maxReceiveCount: 5,
          },
        }
      },
      DLQ: {
        Type: 'AWS::SQS::Queue',
      },
    }
  }
}

module.exports = serverlessConfiguration;
