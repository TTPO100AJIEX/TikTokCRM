import ioredis from 'ioredis';
import Interval from "common/utils/Interval.js";
import RedisTransaction from "./RedisTransaction.js";
import config from "common/configs/config.json" assert { type: "json" };

export default class Redis
{
    #options;
    static #default_options = { connectionName: config.application.name, keyPrefix: config.application.name + '-', enableAutoPipelining: true };
    constructor(options)
    {
        this.#options = { ...Redis.#default_options, ...options };
    }

    get Transaction()
    {
        const outer_this = this;
        return class extends RedisTransaction { constructor() { super(outer_this); } };
    }

    #client;
    get client()
    {
        if (this.#client) return this.#client;
        console.info(`Connected to Redis database ${this.#options.database}`);
        return this.#client = new ioredis(this.#options);
    }
    async end()
    {
        if (this.#client) await this.#client.quit();
        this.#client = null;
    }

    get(key) { return this.client.get(key); }
    getDelete(key) { return this.client.getdel(key); }
    async getExpire(key, expiration) { return (await new this.Transaction().getExpire(key, expiration).execute())[0]; }

    exists(key) { return this.client.exists(key); }

    set(key, value) { return this.client.set(key, value); }
    setExpire(key, value, expiration = new Interval()) { return this.client.setex(key, expiration.toSeconds(), value); }
    setKeepTTL(key, value) { return this.client.set(key, value, "KEEPTTL"); }

    incr(key) { return this.client.incr(key); }

    expire(key, expiration = new Interval(), flag)
    {
        if (flag) return this.client.expire(key, expiration.toSeconds(), flag);
        return this.client.expire(key, expiration.toSeconds());
    }

    delete(...keys) { return (keys.length == 0) ? [ ] : this.client.del(...keys); }
};

export const DatabaseCache = new Redis(config.redis);