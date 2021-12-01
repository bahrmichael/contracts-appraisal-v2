export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  events: [
    {
      schedule: 'rate(30 minutes)'
    }
  ],
  environment: {
    TABLE: {Ref: 'Table'},
  },
  iamRoleStatements: [    {
    Effect: 'Allow',
    Action: ['dynamodb:PutItem', 'dynamodb:Query'],
    Resource: {'Fn::GetAtt': ['Table', 'Arn']}
  }],
  timeout: 600,
}
