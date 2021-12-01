import 'source-map-support/register';
import {DynamoDBStreamEvent, DynamoDBStreamHandler} from "aws-lambda";
import esi from "../../clients/esi";
const DynamoDB = require('aws-sdk/clients/dynamodb');
const ddb = new DynamoDB.DocumentClient();

const {TABLE} = process.env;

export const main: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
    const contractIds: number[] = event.Records
        .filter((r) => r.eventName === 'INSERT')
        .map((r) => r.dynamodb)
        .filter((d) => d.Keys.pk.S === 'contracts')
        .map((d) => +d.Keys.sk.S);

    if (contractIds.length === 0) {
        return;
    }

    const pullPromises: Promise<any>[] = [];
    for (const contractId of contractIds) {
        pullPromises.push(pullContractItems(contractId));
    }
    // get result and filter out undefined responses (where we didn't get a response)
    const result = (await Promise.all(pullPromises)).filter((x) => x);

    console.log('Writing records.', {count: result.length});

    const writePromises: Promise<void>[] = [];
    for (const {contractId, items} of result) {
        writePromises.push(ddb.put({
            TableName: TABLE,
            Item: {
                items,
                pk: 'items',
                sk: `${contractId}`,
            }
        }).promise());
    }
    await Promise.all(writePromises);
}

async function pullContractItems(contractId: number): Promise<any> {
    try {
        const items = (await esi.get(`/v1/contracts/public/items/${contractId}/`)).data;
        console.log('Retrieved items.', {count: items.length, contractId});
        return {
            contractId,
            items,
        }
    } catch (e) {
        console.warn(e);
        return undefined;
    }
}
