import axios from "axios";

const {SCHEDULER_URL} = process.env;

const scheduler = axios.create({
    baseURL: SCHEDULER_URL
});

export default scheduler;