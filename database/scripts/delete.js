import PostgreSQL from "common/databases/PostgreSQL/PostgreSQL.js";
import config from "common/configs/config.json" assert { type: "json" };

const Database = new PostgreSQL({ ...config.postgreSQL, database: "postgres" });
await Database.execute(Database.format(`DROP DATABASE %I WITH (FORCE)`, config.postgreSQL.database));
console.info(`Deleted database ${config.postgreSQL.database}`);
await Database.end();