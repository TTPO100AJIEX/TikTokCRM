import fs from 'fs';
import url from 'url';
import path from 'path';
import fastify from 'fastify';
import ajv_formats from 'ajv-formats';
import config from "common/configs/config.json" assert { type: "json" };

const app = fastify({
    http2: true,
    https: 
    {
        allowHTTP1: true,
        key: fs.readFileSync(config.website.ssl_key, 'utf8'),
        cert: fs.readFileSync(config.website.ssl_cert, 'utf8')
    },
    forceCloseConnections: true,
    ignoreTrailingSlash: true,
    ignoreDuplicateSlashes: true,
    logger: config.stage == "testing",
    disableRequestLogging: true,
    ajv:
    {
        plugins: [ [ ajv_formats, { mode: 'full', keywords: true } ] ],
        customOptions: { removeAdditional: true, useDefaults: true, coerceTypes: "array" }
    }
});

const BASE_DIRECTORY = path.dirname(url.fileURLToPath(import.meta.url));
const directories =
{
    schemas_directory: path.join(BASE_DIRECTORY, "plugins", "schemas"),
    static_directory:  path.join(BASE_DIRECTORY, "static"),
    views_directory:   path.join(BASE_DIRECTORY, "views"),
    routes_directory:  path.join(BASE_DIRECTORY, "routes")
};

import security from "./plugins/security.js"; await app.register(security, directories);
import utility  from "./plugins/utility.js";  await app.register(utility,  directories);
import request  from "./plugins/request.js";  await app.register(request,  directories);
import response from "./plugins/response.js"; await app.register(response, directories);
import oauth    from "./plugins/oauth.js";    await app.register(oauth,    directories);
import routes   from "./plugins/routes.js";   await app.register(routes,   directories);

await app.ready();

app.listen({ port: config.website.port, host: "0.0.0.0" }, (err, address) => 
{
    if (err) throw err;
    console.info(`Server is now listening on ${address}`);
});