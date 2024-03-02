import { Database } from "common/databases/PostgreSQL/PostgreSQL.js"

export default async function tiktok_import()
{
    const choose_streamer_query_string = "SELECT id, unique_id, stream_start FROM streamers ORDER BY last_processed ASC LIMIT 1";
    const { id, unique_id, stream_start } = await Database.execute(choose_streamer_query_string, [ ], { one_response: true }) ?? { };
    if (id == null || id == undefined) return;
    const url = `https://tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=${unique_id}`;
    const tiktok_request = await fetch(url, { method: "GET" });
    const { data } = await tiktok_request.json();
    if (data.user.status == 2)
    {
        const update_query_string = `
            UPDATE streamers 
            SET
                first_stream = COALESCE(first_stream, NOW()),
                last_stream = NOW(),
                avatar_url = $1,
                follower_count = $2,
                stream_start = NOW()
            WHERE id = $3`;
        return await Database.execute(update_query_string, [ data.user.avatarThumb, data.stats.followerCount, id ]);
    }
    if (!stream_start) return;
    const batch = new Database.AnonymousBatch();
    batch.execute(Database.format("UPDATE streamers SET stream_start = NULL WHERE id = %L", id));
    const accounting_query_string = `
        INSERT INTO accounting (streamer_id, day, time) VALUES (%L, NOW()::DATE, NOW() - %L)
        ON CONFLICT (streamer_id, day) DOUPDATE SET time = accounting.time + excluded.time`;
    batch.execute(Database.format(accounting_query_string, id, stream_start));
    await batch.commit();
}