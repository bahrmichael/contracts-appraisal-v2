import 'source-map-support/register';
import {APIGatewayProxyEventBase} from "aws-lambda";

import * as SQS from 'aws-sdk/clients/sqs';
const sqs = new SQS();

const {QUEUE_URL} = process.env;

export const main = async (event: APIGatewayProxyEventBase<any>) => {
    // queue the contract in our own queue so that we can quickly return 200
    const contractId = event.body;
    await sqs.sendMessage({
        QueueUrl: QUEUE_URL,
        MessageBody: contractId,
    }).promise();

    return {
        statusCode: 200,
        body: '',
    }
}
