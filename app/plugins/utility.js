import config from "common/configs/config.json" assert { type: "json" };
import loadJson from "common/utils/algorithms/loadJson.js";

import fs from 'fs';
import path from 'path';
import swagger from '@fastify/swagger';
import under_pressure from '@fastify/under-pressure';
import circuit_breaker from "@fastify/circuit-breaker";

async function loadSchemas(app, directory)
{
    for (const filename of fs.readdirSync(directory))
    {
        const fileStats = fs.lstatSync(path.join(directory, filename));
        if (fileStats.isDirectory()) await loadSchemas(app, path.join(directory, filename));
        if (!fileStats.isFile()) continue;
        const schema = await loadJson(path.join(directory, filename));
        if (Array.isArray(schema)) for (const l_schema of schema) app.addSchema(l_schema);
        else app.addSchema(schema);
    }
}

async function register(app, options)
{
    /*----------------------------------SWAGGER----------------------------------*/
    await app.register(swagger, {
        openapi:
        {
            servers: { url: `https://${config.website.host}`, description: `Main server` },
            components:
            {
                securitySchemes:
                {
                    cookieAuth: { type: 'apiKey', in: 'cookie', name: "__Secure-Authorization", description: "Default cookie authorization" }
                }
            }
        }
    });
    await loadSchemas(app, options.schemas_directory);
    app.addHook("onReady", function (done)
    {
        fs.mkdirSync("documentation", { recursive: true });
        fs.writeFileSync("documentation/docs.json", JSON.stringify(app.swagger(), null, 4), "utf-8");
        fs.writeFileSync("documentation/docs.yml", app.swagger({ yaml: true }), "utf-8");
        done();
    });



    /*----------------------------------CIRCUIT BREAKER----------------------------------*/
    await app.register(circuit_breaker, {
        threshold: 5, timeout: 10000, resetTimeout: 10000,
        onCircuitOpen: async (req, res) =>
        {
            console.warn(`@fastify/circuit-breaker: onCircuitOpen triggered for ${req.routeOptions.url}${req.query} ${JSON.stringify(req.body)}`);
            throw 508;
        },
        onTimeout: async (req, res) =>
        {
            console.warn(`@fastify/circuit-breaker: onTimeout triggered for ${req.routeOptions.url}${req.query} ${JSON.stringify(req.body)}`);
            throw 504;
        }
    });
    



    /*----------------------------------UNDER PRESSURE----------------------------------*/
    await app.register(under_pressure, { 
        maxEventLoopDelay: 250,
        maxHeapUsedBytes: 1048576000,
        maxRssBytes: 1048576000,
        maxEventLoopUtilization: 0.8,
        message: 'The server is exhausted! Try again later!',
        retryAfter: 60,
        pressureHandler: (req, res, type, value) =>
        {
            if (type === under_pressure.TYPE_EVENT_LOOP_UTILIZATION) { console.warn(`Event loop has been exhausted: ${value}`); return; }
            if (type === under_pressure.TYPE_EVENT_LOOP_DELAY) { console.warn(`Event loop delay is too high: ${value}`); return; }
            if (type === under_pressure.TYPE_HEAP_USED_BYTES) { console.warn(`Heap has been exhausted: ${value}`); return; }
            if (type === under_pressure.TYPE_RSS_BYTES) { console.warn(`RSS has been exhausted: ${value}`); return; }
            if (type === under_pressure.TYPE_HEALTH_CHECK) { console.warn(`Health check: ${value}`); return; }
            throw 503;
        },
        exposeStatusRoute:
        {
            routeResponseSchemaOpts:
            {
                metrics:
                {
                    type: 'object',
                    properties: { eventLoopDelay: { type: 'number' }, rssBytes: { type: 'number' }, heapUsed: { type: 'number' }, eventLoopUtilized: { type: 'number' } }
                },
                uptime: { type: 'number' }
            },
            url: "/serverstatus"
        },
        healthCheck: async (fastifyInstance) => ({ metrics: fastifyInstance.memoryUsage(), uptime: process.uptime() }),
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'utility', encapsulate: false });