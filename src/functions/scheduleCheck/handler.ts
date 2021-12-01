import 'source-map-support/register';
import {DynamoDBStreamEvent, DynamoDBStreamHandler} from "aws-lambda";
import scheduler from "../../clients/scheduler";

const {API_KEY, USER, OWN_URL} = process.env;

export const main: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
    const items: any[] = event.Records
        .filter((r) => r.eventName === 'INSERT')
        .map((r) => r.dynamodb)
        .filter((d) => d.Keys.pk.S === 'contracts')
        .map((d) => d.NewImage)
        // sanity check to skip broken records
        .filter((i) => i.date_issued);

    if (items.length === 0) {
        return;
    }

    console.log('Scheduling checks.', {count: items.length});

    const promises: Promise<any>[] = [];
    for (const item of items) {
        console.log({item});
        const contractId = item.contract_id.N;
        const dateIssued = item.date_issued.S;
        console.log({contractId, dateIssued});
        const increment = (new Date().getTime() - new Date(dateIssued).getTime()) / 1_000;
        // Items route is cached for 3600 seconds. Add 300 seconds on top because the item loader runs on the side.
        const nextDate = Math.ceil(new Date().getTime() / 1_000 + 3_600 + 300 + increment);

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
}
