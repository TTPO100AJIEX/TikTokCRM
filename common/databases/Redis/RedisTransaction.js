import Redis from './Redis.js';
import Interval from 'common/utils/Interval.js';

export default class RedisTransaction
{
    #results_ignore = [ ];
    constructor(cache)
    {
        if (!(cache instanceof Redis)) throw `'cache' is not an instance of 'Redis'`;
        this.client = cache.client.multi();
    }
    
    get(key) { this.client.get(key); return this; }
    getDelete(key) { this.client.getdel(key); return this; }
    getExpire(key, expiration)
    {
        this.#results_ignore.push(this.client.length);
        return this.get(key).expire(key, expiration);
    }

    exists(key) { this.client.exists(key); return this; }

    set(key, value) { this.client.set(key, value); return this; }
    setExpire(key, value, expiration = new Interval()) { this.client.setex(key, expiration.toSeconds(), value); return this; }
    setKeepTTL(key, value) { this.client.set(key, value, "KEEPTTL"); return this; }
    
    incr(key) { this.client.incr(key); return this;}

    expire(key, expiration = new Interval(), flag)
    {
        if (flag) this.client.expire(key, expiration.toSeconds(), flag);
        else this.client.expire(key, expiration.toSeconds());
        return this;
    }

    delete(...keys) { this.client.del(...keys); return this; }

    async execute()
    {
        const results = await this.client.exec();
        const errors = results.map(res => res[0]).filter(e => e);
        if (errors.length != 0) throw errors;
        return results.filter((value, index) => !this.#results_ignore.includes(index)).map(res => res[1]);
    }
};