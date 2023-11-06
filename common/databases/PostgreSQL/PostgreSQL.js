import Interval from "common/utils/Interval.js";
import config from "common/configs/config.json" assert { type: "json" };

import NamedBatch from "./batches/NamedBatch.js";
import BarrierBatch from "./batches/BarrierBatch.js";
import VariableBatch from "./batches/VariableBatch.js";
import CallbackBatch from "./batches/CallbackBatch.js";
import AnonymousBatch from "./batches/AnonymousBatch.js";

import pg from 'pg';
import pg_format from 'pg-format';
import JSONPointer from "jsonpointer";

pg.types.setTypeParser(pg.types.builtins.INTERVAL, value => new Interval(value));
pg.types.setTypeParser(pg.types.builtins.NUMERIC, value => Number(value));

export default class PostgreSQL
{
    #options;
    static #default_options = { parseInputDatesAsUTC: true, application_name: config.application.name };
    constructor(options)
    {
        this.#options = { ...PostgreSQL.#default_options, ...options };
    }

    get format() { return pg_format; }

    get NamedBatch()     { const outer_this = this; return class extends NamedBatch     { constructor() { super(outer_this); } }; }
    get BarrierBatch()   { const outer_this = this; return class extends BarrierBatch   { constructor() { super(outer_this); } }; }
    get VariableBatch()  { const outer_this = this; return class extends VariableBatch  { constructor() { super(outer_this); } }; }
    get CallbackBatch()  { const outer_this = this; return class extends CallbackBatch  { constructor() { super(outer_this); } }; }
    get AnonymousBatch() { const outer_this = this; return class extends AnonymousBatch { constructor() { super(outer_this); } }; }

    #client;
    get client()
    {
        if (this.#client) return this.#client;
        console.info(`Connected to PostgreSQL database ${this.#options.database}`);
        return this.#client = new pg.Pool(this.#options);
    }
    async end()
    {
        if (this.#client) await this.#client.end();
        this.#client = null;
    }


    #parsePointers(data)
    {
        const parseObjectPointers = (object) =>
        {
            let result = { };
            for (const key in object) JSONPointer.set(result, "/" + key, object[key]);
            return result;
        };
        return data.map(parseObjectPointers);
    }
    
    async execute(query, params, { one_response = false } = { })
    {
        const data = await this.client.query(query, params);
        const rows = this.#parsePointers(data.rows);
        return one_response ? rows[0] : rows;
    }

    async executeMultiple(queries = { })
    {
        const unifyQuery = (name, query) =>
        {
            const query_string = query.query ?? query;
            const one_response = query.one_response ?? false;
            return { name, query: query_string, one_response };
        };
        const plan = Object.entries(queries).map(entry => unifyQuery(entry[0], entry[1]));
        if (plan.length == 0) return Array.isArray(queries) ? [ ] : { };

        const raw_data = await this.client.query(plan.map(record => record.query).join(';\n'));
        const data = Array.isArray(raw_data) ? raw_data : [ raw_data ];
        const rows = data.map(res => this.#parsePointers(res.rows));

        const recordToResponse = (record, index) => record.one_response ? rows[index][0] : rows[index];
        const recordToResponseEntry = (record, index) => [ record.name, recordToResponse(record, index) ];
        return Array.isArray(queries) ? plan.map(recordToResponse) : Object.fromEntries(plan.map(recordToResponseEntry));
    }


    #listen_connection;
    #callbacks = new Map();
    payload_types = [ 'json', 'text' ];
    async dispatch(channel, payload, payload_type)
    {
        if (!payload_type) return this.payload_types.forEach(this.dispatch.bind(this, channel, payload));

        if (payload_type == 'json')
        {
            try { payload = JSON.parse(payload); } catch(err) { payload = { }; }
        }
        
        const channel_code = `${channel}/${payload_type}`;
        for (const callback of this.#callbacks.get(channel_code) ?? [ ])
        {
            try { await callback(payload); } catch(err) { console.warn(err); }
        }
    }

    async listen(channel, callback, payload_type)
    {
        if (!this.#listen_connection)
        {
            this.#listen_connection = await this.client.connect();
            this.#listen_connection.on('notification', async msg => await this.dispatch(msg.channel, msg.payload));
        }
        const channel_code = `${channel}/${payload_type}`;
        if (this.#callbacks.has(channel_code)) this.#callbacks.get(channel_code).push(callback);
        else this.#callbacks.set(channel_code, [ callback ]);
        await this.#listen_connection.query(this.format(`LISTEN %I`, channel));
    }
};

export const Database = new PostgreSQL(config.postgreSQL);