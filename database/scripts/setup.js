import fs from 'fs';
import url from 'url';
import path from 'path';
import { Database } from 'common/databases/PostgreSQL/PostgreSQL.js';

async function readQueries(folder)
{
    const { default: order } = await import(path.join(folder, 'order.json'), { assert: { type: "json" } });
    let queries = [ ];
    for (const file of order)
    {
        if (path.parse(file).ext == ".sql") queries = queries.concat(fs.readFileSync(path.join(folder, file), "utf-8").split(';'));
        else queries = queries.concat(await readQueries(path.join(folder, file)));
    }
    return queries;
}

await Database.executeMultiple(await readQueries(path.join(path.dirname(url.fileURLToPath(import.meta.url)), "setup")));
console.info(`Finished database setup`);
await Database.end();