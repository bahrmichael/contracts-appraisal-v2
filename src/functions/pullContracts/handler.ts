import 'source-map-support/register';
import esi from "../../clients/esi";
const DynamoDB = require('aws-sdk/clients/dynamodb');
const ddb = new DynamoDB.DocumentClient();

const {TABLE} = process.env;

export const main = async () => {
    try {
        await esi.get(`/v2/status`);
    } catch {
        console.log('Esi is down.');
        return;
    }

    const pullPromises: Promise<any>[] = [];
    for (let regionId = 10000001; regionId <= 10000070; regionId++) {
        // skip non existent regions
        if ([10000024, 10000026].includes(regionId)) {
            continue;
        }
        pullPromises.push(pullRegionalItemExchanges(regionId));
    }

    const latestId = await getLatestId();
    const newContracts = (await Promise.all(pullPromises))
        .flatMap((x) => x)
        .filter((contract) => contract.contract_id > latestId);

    console.log('Writing new contracts.', {count: newContracts.length});

    const writePromises: Promise<void>[] = [];
    for (const newContract of newContracts) {
        writePromises.push(ddb.put({
            TableName: TABLE,
            Item: {
                ...newContract,
                pk: 'contracts',
                sk: `${newContract.contract_id}`,
            }
        }).promise());
    }
    await Promise.all(writePromises);
}

async function getLatestId(): Promise<number> {
    const latestContract = (await ddb.query({
        TableName: TABLE,
        KeyConditionExpression: 'pk = :p',
        ExpressionAttributeValues: {
            ':p': 'contracts',
        },
        ScanIndexForward: false,
        Limit: 1,
    }).promise()).Items[0];
    return latestContract?.contract_id ?? 0;
}

async function pullRegionalItemExchanges(regionId: number): Promise<any[]> {
    const head = await esi.head(`/v1/contracts/public/${regionId}/`);
    const pages = +head.headers['x-pages'];
    console.log('Loading region contracts', {regionId, pages});
    const promises: Promise<any>[] = [];
    for (let page = 1; page <= pages; page++) {
        promises.push(esi.get(`/v1/contracts/public/${regionId}/?page=${page}`).then((res) => res.data));
    }
    return (await Promise.all(promises))
        .flatMap((x) => x)
        .filter((contract) => contract.type === 'item_exchange');
}
