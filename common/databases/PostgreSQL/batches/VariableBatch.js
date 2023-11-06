import PostgreSQL from "../PostgreSQL.js";

export default class VariableBatch
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
    
    #variables = new Map();
    variable(name, type)
    {
        if (this.#variables.has(name) && this.#variables.get(name) != type) throw 'VariableBatch::variable - type mismatch detected';
        this.#variables.set(name, type);
        return this;
    }
    
    get #variable_declarations()
    {
        return Array.from(this.#variables.entries()).map(entry => this.database.format(`%I %s;`, entry[0], entry[1])).join('');
    }
    get #query_list()
    {
        return this.#queries.map(query => query + ";").join('');
    }
    async commit()
    {
        const query = this.database.format(`DO LANGUAGE plpgsql $$ DECLARE ${this.#variable_declarations} BEGIN ${this.#query_list} END $$`);
        await this.database.execute(query);
    }
};