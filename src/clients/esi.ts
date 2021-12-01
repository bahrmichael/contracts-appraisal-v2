import axios from "axios";

const esi = axios.create({
    baseURL: 'https://esi.evetech.net'
});

const axiosRetry = require('axios-retry');

axiosRetry(esi, {
    retries: 3, // number of retries
    retryDelay: (retryCount) => {
        console.log(`retry attempt: ${retryCount}`);
        return retryCount * 100; // time interval between retries
    },
    retryCondition: (error) => {
        // if retry condition is not specified, by default idempotent requests are retried
        return error.response?.status >= 500;
    },
});

export default esi;