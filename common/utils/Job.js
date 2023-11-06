import Interval from "common/utils/Interval.js";

function maybeConstructInterval(interval)
{
    if (!interval || interval instanceof Interval) return interval;
    return new Interval(interval);
}

export default class Job
{
    constructor(executor, settings)
    {
        this.killed = false;
        this.last_run = null;
        this.executor = executor;
        this.settings = settings;
        this.name = settings.name;
        this.interval = maybeConstructInterval(settings.interval);
        this.max_interval = maybeConstructInterval(settings.max_interval);
        this.min_interval = maybeConstructInterval(settings.min_interval);
    }

    run()
    {
        const start = new Date();
        const result = this.executor(this);
        result.then(result =>
        {
            this.last_run = { start, end: new Date(), status: "SUCCESS" };
            this.schedule(result);
        });
        result.catch(err =>
        {
            this.last_run = { start, end: new Date(), status: "FAIL" };
            console.error(err);
            this.schedule();
        })
    }
    
    schedule(target_interval)
    {
        if (this.killed) return;
        if (this.timeout) clearTimeout(this.timeout);
        if (this.name)
        {
            const completed_in = new Interval((this.last_run.end - this.last_run.start) / 1000);
            console.info(`Completed job ${this.name} in ${completed_in.toFormat()}`);
        }
        
        if (this.interval instanceof Interval)
        {
            if (this.name) console.info(`Scheduling periodic ${this.name} in ${this.interval.toFormat()}`);
            return this.timeout = setTimeout(this.run.bind(this), this.interval.toMilliseconds());
        }

        if (target_interval instanceof Interval && this.min_interval instanceof Interval && this.max_interval instanceof Interval)
        {
            const min = this.min_interval.toSeconds();
            const max = this.max_interval.toSeconds();
            const timeout = new Interval(Math.max(Math.min(target_interval.toSeconds(), max), min));
            if (this.name) console.info(`Scheduling variadic ${this.name} in ${timeout.toFormat()}`);
            return this.timeout = setTimeout(this.run.bind(this), timeout.toMilliseconds());
        }
        
        if (this.name) console.info(`Non-repeating job ${this.name} completed`);
    }

    kill()
    {
        if (this.timeout) clearTimeout(this.timeout);
        delete this.timeout;
        this.killed = true;
    }
};