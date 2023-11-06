import PostgreSQL from "../PostgreSQL.js";

export default class AnonymousBatch
{
    constructor(database)
    {
        if (!(database instanceof PostgreSQL)) throw `'database' is not an instance of 'PostgreSQL'`;
        this.database = database;
    }

    #queries = [ ];
    execute(query)
    {
        this.#queries.push(query);
        return this;
    }
    
    commit()
    {
        const result = this.database.executeMultiple(this.#queries);
        this.#queries = [ ];
        return result;
    }
};