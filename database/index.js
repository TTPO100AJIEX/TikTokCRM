import Job from "common/utils/Job.js";
import config from "common/configs/config.json" assert { type: "json" };

const jobs = [ ];
for (const job_name in config.postgreSQL.jobs)
{
    const settings = { ...config.postgreSQL.jobs[job_name], name: job_name };
    const { default: executor } = await import(`./jobs/${job_name}.js`);
    const job = new Job(executor, settings);
    jobs.push(job);
    job.run();
}