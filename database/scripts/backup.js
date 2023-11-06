import url from 'url';
import path from 'path';
import ChildProcess from 'child_process';
import config from "common/configs/config.json" assert { type: "json" };

const name = new Date(), options = config.postgreSQL;
const folder = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
const filename = `${name.getFullYear()}-${name.getMonth() + 1}-${name.getDate()}_${name.getHours()}-${name.getMinutes()}-${name.getSeconds()}-${name.getMilliseconds()}`;
const command = ChildProcess.spawn('pg_dump', [ `--dbname=postgresql://${options.user}:${options.password}@${options.host}:${options.port}/${options.database}`, "-f", `${folder}/dumps/${filename}.sql` ]);
command.on('spawn', () => console.info(`Database backup started!`));
command.on('close', (code) => console.info(`Database backup finished with exit code ${code}!`));