import crypto from 'crypto';
import Interval from "common/utils/Interval.js";
import { DatabaseCache } from 'common/databases/Redis/Redis.js';
import config from "common/configs/config.json" assert { type: "json" };

async function register(app, options)
{
    app.decorateRequest("authentication_code", null);
    app.decorateRequest("createAuthenticationCode", async function()
    {
        if (this.authentication_code) return this.authentication_code;
        const code = crypto.randomBytes(16).toString('hex');
        const data = { "ip": this.ip, "page": this.url };
        const interval = new Interval(config.website.authentication_expiration);
        await DatabaseCache.setExpire(`authentication-${code}`, JSON.stringify(data), interval);
        return this.authentication_code = code;
    });
    app.addHook('preValidation', async (req, res) =>
    {
        if (!req.routeOptions.config?.access || req.method == "HEAD" || req.url.startsWith("/static")) return;
        await req.createAuthenticationCode();
    });



    app.decorateRequest("authentication", null);
    app.decorateRequest("authenticate", async function(code)
    {
        if (this.authentication) return this.authentication;
        if (!code) code = this.body?.authentication || this.query?.state;

        const data_string = await DatabaseCache.getDelete(`authentication-${code}`);
        if (!data_string) return this.authentication = null;
        const data = JSON.parse(data_string);

        if (this.ip != data.ip) return this.authentication = null;
        return this.authentication = data;
    });
    app.decorateRequest("needs_authentication", function()
    {
        if (this.routeOptions.config?.authentication === false) return false;
        if (this.routeOptions.config?.authentication === true) return true;
        return ![ "GET", "HEAD" ].includes(this.method);
    });
    app.addHook('preHandler', async (req, res) => 
    {
        if (req.needs_authentication() && !(await req.authenticate())) throw 401;
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'oauth-authentication', encapsulate: false });