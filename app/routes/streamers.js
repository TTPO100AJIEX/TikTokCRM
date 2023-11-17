import { Database } from 'common/databases/PostgreSQL/PostgreSQL.js';

async function register(app, options)
{
    app.get("/streamers", { config: { access: "ceo" } }, async (req, res) =>
    {
        const streamers = await Database.execute(`SELECT * FROM streamers_view`);
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
                "status": { type: "string", enum: [ 'CONTRACT', 'PREPARATION', 'ACTIVE', 'PAUSED', 'FIRED' ] },
                "category": { type: "string", enum: [ 'OUR', 'BACKSTAGE', 'OUTSIDE', 'ETC' ] },
                "stream": { type: "string", enum: [ 'STREAM_1', 'STREAM_2', 'STREAM_3' ] },
                "streamer_group": { type: "string", enum: [ 'GROUP_1', 'GROUP_2', 'GROUP_3' ] },
                "pledge": { $ref: "uint" },
                "authentication": { $ref: "authentication" }
            }
        }
    };
    app.post("/streamers", { schema: POST_SCHEMA, config: { authentication: true, access: "admin" } }, async (req, res) =>
    {
        const { id, status, category, stream, streamer_group, pledge, unique_id } = req.body;
        const url = `https://tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=${unique_id}`;
        const tiktok_request = await fetch(url, { method: "GET" });
        const { data } = await tiktok_request.json();

        if ('id' in req.body)
        {
            const params = [ status, category, stream, streamer_group, pledge, unique_id, data.user.id, data.user.avatarThumb, data.stats.followerCount, id ];
            const fields = "status = $1, category = $2, stream = $3, streamer_group = $4, pledge = $5, unique_id = $6, tiktok_id = $7, avatar_url = $8, follower_count = $9";
            await Database.execute(`UPDATE streamers SET ${fields} WHERE id = $10`, params);
        }
        else
        {
            const params = [ status, category, stream, streamer_group, pledge, unique_id, data.user.id, data.user.avatarThumb, data.stats.followerCount ];
            const fields = "status, category, stream, streamer_group, pledge, unique_id, tiktok_id, avatar_url, follower_count";
            await Database.execute(`INSERT INTO streamers (${fields}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, params);
        }
        return res.status(303).redirect("/streamers");
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'streamers-routes', encapsulate: false });