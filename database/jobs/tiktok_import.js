import { Database } from "common/databases/PostgreSQL/PostgreSQL.js"

export default async function tiktok_import()
{
    const choose_streamer_query_string = "SELECT id, unique_id FROM streamers ORDER BY last_processed ASC LIMIT 1";
    const { id, unique_id } = await Database.execute(choose_streamer_query_string, [ ], { one_response: true });
    const url = `https://tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=${unique_id}`;
    const tiktok_request = await fetch(url, { method: "GET" });
    const { data } = await tiktok_request.json();
    if (data.users.status != 2)
    {
        // если при прошлой проверке был 2 - закончить подсчет времени и записать данные на страницу “Учет”;
        // TODO
       return;
    }
    // начать подсчет времени проведения прямой трансляции
    // TODO

    const update_query_string = "UPDATE streamers SET first_stream = COALESCE(first_stream, NOW()), last_stream = NOW(), avatar_url = $1, follower_count = $2 WHERE id = $3";
    await Database.execute(update_query_string, [ data.user.avatarThumb, data.stats.followerCount, id ]);
}