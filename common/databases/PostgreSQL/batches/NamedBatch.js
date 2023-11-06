import PostgreSQL from "../PostgreSQL.js";

export default class NamedBatch
{
    constructor(database)
    {
        if (!(database instanceof PostgreSQL)) throw `'database' is not an instance of 'PostgreSQL'`;
        this.database = database;
    }

    #queries = { };
    execute(name, query)
    {
        this.#queries[name] = query;
        return this;
    }
    
    commit()
    {
        const result = this.database.executeMultiple(this.#queries);
        this.#queries = { };
        return result;
    }
};