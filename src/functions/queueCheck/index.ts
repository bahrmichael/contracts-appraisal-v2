export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  events: [
    {
      http: {
        method: 'POST',
        path: '/check',
        authorizer: 'authorizerFun',
      }
    }
  ],
  environment: {
    QUEUE_URL: {Ref: 'Queue'},
},
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: ['sqs:SendMessage'],
      Resource: {'Fn::GetAtt': ['Queue', 'Arn']}
    },
  ],
}
