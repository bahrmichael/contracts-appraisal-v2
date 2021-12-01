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
    OWN_URL: { "Fn::Join" : ["", ["https://", { "Ref" : "ApiGatewayRestApi" }, ".execute-api.us-east-1.amazonaws.com/${env:STAGE, \"dev\"}" ] ]  },
    API_KEY: process.env.SCHEDULER_API_KEY,
    USER: process.env.SCHEDULER_USER,
    SCHEDULER_URL: process.env.SCHEDULER_URL,
  },
  iamRoleStatements: [    {
    Effect: 'Allow',
    Action: ['dynamodb:GetItem', 'dynamodb:UpdateItem'],
    Resource: {'Fn::GetAtt': ['Table', 'Arn']}
  }],
  timeout: 600,
}
