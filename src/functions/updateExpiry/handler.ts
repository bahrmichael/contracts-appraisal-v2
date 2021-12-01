import 'source-map-support/register';
import {SQSEvent, SQSHandler} from "aws-lambda";
import esi from "../../clients/esi";
import scheduler from "../../clients/scheduler";

const DynamoDB = require('aws-sdk/clients/dynamodb');
const ddb = new DynamoDB.DocumentClient();

const {TABLE, USER, API_KEY, OWN_URL} = process.env;

export const main: SQSHandler = async (event: SQSEvent) => {
    console.log(event);
    const contractIds: number[] = event.Records
        // sanity check to skip broken records
        .filter((r) => r.body)
        .map((r) => +r.body);

    try {
        await esi.get(`/v2/status`);
    } catch {
        console.log('Esi is down.');
        const nextDate = Math.ceil(new Date().getTime() / 1_000 + 600 + Math.random() * 600);

        const promises: Promise<any>[] = [];
        for (const contractId of contractIds) {
            const data = {
                sendAt: new Date(nextDate * 1_000).toISOString(),
                payload: contractId,
                targetUrl: `${OWN_URL}/check`,
                targetType: 'HTTPS',
            };
            console.log('Scheduling next check.', data);
            promises.push(scheduler.post(`/event`, data, {
                headers: {
                    user: USER,
                    Authorization: API_KEY,
                }
            }));
        }
        await Promise.all(promises);

        return;
    }

    const promises: Promise<any>[] = [];
    for (const contractId of contractIds) {
        promises.push(processContract(contractId));
    }
    await Promise.all(promises);
}

async function processContract(contractId: number): Promise<void> {
    try {
        await esi.head(`/v1/contracts/public/items/${contractId}/`);
        // Contract is still up. Reschedule it.

        const contract = (await ddb.get({
            Table: TABLE,
            Key: {
                pk: 'contracts',
                sk: `${contractId}`,
            }
        }).promise()).Item;

        const dateIssued = contract.date_issued;
        const increment = (new Date().getTime() - new Date(dateIssued).getTime()) / 1_000;
        // Items route is cached for 3600 seconds.
        const nextDate = Math.ceil(new Date().getTime() / 1_000 + 3_600 + increment);
        const sendAt = new Date(nextDate * 1_000).toISOString();
        console.log('Rescheduling', {contractId, sendAt, increment});

        const data = {
            sendAt,
            payload: contractId,
            targetUrl: 'TODO/check',
            targetType: 'HTTPS',
        };
        console.log('Scheduling next check.', data);
        await scheduler.post(`/message`, data, {
            headers: {
                user: USER,
                Authorization: API_KEY,
            }
        });
    } catch (e) {
        const {status} = e.response;

        if (status === 404 || status === 403) {
            await ddb.update({
                TableName: TABLE,
                Key: {
                    pk: 'contracts',
                    sk: `${contractId}`,
                },
                UpdateExpression: 'set httpStatus = :s, statusDate = :d',
                ExpressionAttributeValues: {
                    ':s': status,
                    ':d': new Date().toISOString(),
                }
            }).promise();
        } else {
            // todo: handle throttling
            console.warn(e?.response ?? e);
            throw Error('Unknown status: ' + status);
        }
    }
}
