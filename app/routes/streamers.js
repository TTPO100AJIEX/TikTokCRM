import { Database } from 'common/databases/PostgreSQL/PostgreSQL.js';

async function register(app, options)
{
    app.get("/streamers", { config: { access: [ "ceo", "curator" ] } }, async (req, res) =>
    {
        let streamers = [ ];
        const query_string = `SELECT * FROM streamers_view WHERE
                stream IN (SELECT unnest(streams) FROM employees WHERE id = $1) AND
                streamer_group IN (SELECT unnest(responsibilities) FROM employees WHERE id = $1)
            ORDER BY created ASC`;
        streamers = await Database.execute(query_string, [ req.authorization.id ]);
        return res.render("general/layout.ejs", { template: "streamers", streamers });
    });

    const POST_SCHEMA =
    {
        body:
        {
            type: "object",
            required: [ "unique_id", "status", "category", "stream", "streamer_group", "pledge", "authentication" ],
            additionalProperties: false,
            properties:
            {
                "id": { $ref: "uint" },
                "unique_id": { type: "string" },
                "password": { type: "string", maxLength: 50 },
                "status": { type: "string", enum: [ 'CONTRACT', 'PREPARATION', 'ACTIVE', 'PAUSED', 'FIRED' ] },
                "category": { type: "string", enum: [ 'OUR', 'BACKSTAGE', 'OUTSIDE', 'ETC' ] },
                "stream": { type: "string", enum: [ 'STREAM_1', 'STREAM_2', 'STREAM_3' ] },
                "streamer_group": { type: "string", enum: [ 'GROUP_1', 'GROUP_2', 'GROUP_3' ] },
                "pledge": { $ref: "uint" },
                "authentication": { $ref: "authentication" }
            }
        }
    };
    app.post("/streamers", { schema: POST_SCHEMA, config: { authentication: true, access: [ "admin", "curator" ] } }, async (req, res) =>
    {
        const { access, responsibility } = req.authorization;
        const { id, password, status, category, stream, streamer_group, pledge, unique_id } = req.body;
        if (access != "ADMIN" && responsibility != streamer_group) throw 403;
        const url = `https://tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=${unique_id}`;
        const tiktok_request = await fetch(url, { method: "GET" });
        const { data } = await tiktok_request.json();

        const params = [ password, status, category, stream, streamer_group, pledge, unique_id, data.user.id, data.user.avatarThumb, data.stats.followerCount ];
        if ('id' in req.body)
        {
            const fields = "password = $1, status = $2, category = $3, stream = $4, streamer_group = $5, pledge = $6, unique_id = $7, tiktok_id = $8, avatar_url = $9, follower_count = $10";
            const query_string = `UPDATE streamers SET ${fields} WHERE id = $11`;
            if (access == "ADMIN") await Database.execute(query_string, [ ...params, id ]);
            else await Database.execute(query_string + ` AND streamer_group = $12`, [ ...params, id, responsibility ]);
        }
        else
        {
            const fields = "password, status, category, stream, streamer_group, pledge, unique_id, tiktok_id, avatar_url, follower_count";
            await Database.execute(`INSERT INTO streamers (${fields}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, params);
        }
        return res.status(303).redirect("/streamers");
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'streamers-routes', encapsulate: false });