import 'source-map-support/register';

const {ACCESS_KEY} = process.env;

export const main = async (event: any) => {
    const apiKey = event.authorizationToken;

    if (apiKey !== ACCESS_KEY) {
        return generatePolicy('user', 'Deny', event.methodArn);
    }
    return generatePolicy('user', 'Allow', event.methodArn);
};

// Help function to generate an IAM policy
function generatePolicy(principalId, effect, resource, context?: any) {
    const authResponse: any = {};

    authResponse.principalId = principalId;
    if (effect && resource) {
        const policyDocument: any= {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        const statementOne: any = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }

    authResponse.context = context;
    return authResponse;
}