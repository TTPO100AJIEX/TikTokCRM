import Interval from 'common/utils/Interval.js';
import { Database } from 'common/databases/PostgreSQL/PostgreSQL.js';

async function register(app, options)
{
    app.get("/accounting", { config: { access: [ "ceo", "curator" ] } }, async (req, res) =>
    {
        const DAY_TO_MS = 24 * 60 * 60 * 1000;
        const data = await Database.execute(`SELECT * FROM accounting RIGHT JOIN streamers ON streamer_id = id ORDER BY id ASC, day ASC`);

        const streamers = [ ];
        const maxDay = new Date();
        const minDay = Math.min(...data.map(e => e.day).filter(e => e));
        const total_days = Math.floor((maxDay - minDay) / DAY_TO_MS) + 1;
        const days = new Array(total_days).fill(null).map((_, day) => new Date(minDay + day * DAY_TO_MS));
        for (let i = 0; i < data.length; )
        {
            function getData(day)
            {
                if (data[i]?.day?.getTime() == day.getTime()) return data[i++];
                return { day, time: new Interval(0), diamonds: 0 };
            }
            const first_index = i;
            streamers.push(Object.assign(days.map(getData), data[first_index]));
            if (first_index == i) i++;
        }
        return res.render("general/layout.ejs", { template: "accounting", days, streamers });
    });

    const POST_SCHEMA =
    {
        body:
        {
            type: "object",
            required: [ "authentication" ],
            additionalProperties: false,
            properties:
            {
                "authentication": { $ref: "authentication" }
            },
            patternProperties:
            {
                "^time-[\\d]-[\\d]{1,2}-[\\d]{1,2}-[\\d]{4}$": { $ref: "uint" },
                "^diamonds-[\\d]-[\\d]{1,2}-[\\d]{1,2}-[\\d]{4}$": { $ref: "uint" }
            }
        }
    };
    app.post("/accounting", { schema: POST_SCHEMA, config: { authentication: true, access: [ "admin", "curator" ] } }, async (req, res) =>
    {
        const batch = new Database.AnonymousBatch();
        batch.execute("TRUNCATE TABLE accounting");
        for (const key in req.body)
        {
            const [ field, streamer_id, day, month, year ] = key.split('-');
            if (field != "time") continue;
            const date = new Date(year, month, day, 12, 0, 0, 0);
            const diamonds = req.body[`diamonds-${streamer_id}-${day}-${month}-${year}`];
            const time = new Interval(req.body[`time-${streamer_id}-${day}-${month}-${year}`] * 60);
            const query_string = `INSERT INTO accounting (streamer_id, day, time, diamonds) VALUES (%L, %L::date, %L, %L)`;
            batch.execute(Database.format(query_string, streamer_id, date, time.toPostgres(), diamonds));
        }
        await batch.commit();
        return res.status(303).redirect("/accounting");
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'streamers-routes', encapsulate: false });