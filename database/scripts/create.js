import PostgreSQL from "common/databases/PostgreSQL/PostgreSQL.js";
import config from "common/configs/config.json" assert { type: "json" };

const Database = new PostgreSQL({ ...config.postgreSQL, database: "postgres" });
await Database.execute(Database.format(`CREATE DATABASE %I TEMPLATE template0 ENCODING UTF8`, config.postgreSQL.database));
console.info(`Created database ${config.postgreSQL.database}`);
await Database.end();