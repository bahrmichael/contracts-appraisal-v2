export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  events: [
    {
      stream: {
        type: 'dynamodb',
        arn: {'Fn::GetAtt': ['Table', 'StreamArn']}
      }
    }
  ],
  environment: {
    TABLE: {Ref: 'Table'},
  },
  iamRoleStatements: [{
    Effect: 'Allow',
    Action: ['dynamodb:PutItem'],
    Resource: {'Fn::GetAtt': ['Table', 'Arn']}
  }],
  timeout: 600,
}
