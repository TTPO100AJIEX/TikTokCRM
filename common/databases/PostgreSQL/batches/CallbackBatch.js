import PostgreSQL from "../PostgreSQL.js";

export default class CallbackBatch
{
    constructor(database)
    {
        if (!(database instanceof PostgreSQL)) throw `'database' is not an instance of 'PostgreSQL'`;
        this.database = database;
    }

    #queries = [ ];
    #callbacks = [ ];
    execute(query, callback)
    {
        this.#queries.push(query);
        this.#callbacks.push(callback);
        return this;
    }

    async commit()
    {
        const data = await this.database.executeMultiple(this.#queries);
        for (let i = 0; i < this.#queries.length; i++) await this.#callbacks[i](data[i]);
        this.#queries = [ ];
        this.#callbacks = [ ];
    }
};