import config from "common/configs/config.json" assert { type: "json" };

import cookie from "@fastify/cookie";
import formbody from "@fastify/formbody";

async function register(app, options)
{
    /*----------------------------------FORMBODY----------------------------------*/
    await app.register(formbody, { bodyLimit: 1048576 });
    
    /*----------------------------------COOKIE----------------------------------*/
    await app.register(cookie, { secret: config.website.secret });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'request', encapsulate: false });