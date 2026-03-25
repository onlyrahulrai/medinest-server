import { Worker, Job } from "bullmq";
// @ts-ignore
import unirest from "unirest";

import { processReminders } from "../services/reminderService";
import { processLogGeneration } from '../jobs/logGenerationJob';

const sendOtp = async ({ contacts, otp }: { contacts: Array<number>, otp: number }) => {
    try {
        const req = unirest("GET", process.env.SMS_API_URL);

        req.query({
            "key": process.env.SMS_API_KEY,
            "campaign": process.env.SMS_API_CAMPAIGN,
            "routeid": process.env.SMS_API_ROUTEID,
            "type": process.env.SMS_API_TYPE,
            "senderid": process.env.SMS_API_SENDERID,
            "template_id": process.env.SMS_API_TEMPLATE_ID,
            "pe_id": process.env.SMS_API_PE_ID,
            "contacts": contacts,
            "msg": `OTP for login your account ${otp} and valid till 2 minutes. Do not share this OTP to anyone for security reasons. Via DigiDonar`
        });

        req.end(function (res: any) {

            if (res.error) throw new Error(res.error);

            console.log(res.body);
        });
    } catch (error: any) {
        console.log("Error: ", error)
    }
}

const worker = new Worker(
    "SS-CommonTask",
    async (job: { name: string; data: any }) => {
        console.log("----- Job Executed -----")

        if (job.name === 'send-verification-otp') {
            await sendOtp(job.data);
        }

        if (job.name === 'process-reminders') {
            await processReminders();
        }

        if (job.name === 'generate-logs') {
            await processLogGeneration();
        }
    },
    {
        connection: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
        },
    }
);

worker.on("completed", (job: { data: any }) => {
    console.log(`✅ Common task completed`);
});

worker.on("failed", (job: Job | undefined, err: any) => {
    console.error(`❌ Failed job ${job?.id}:`, err);
});
