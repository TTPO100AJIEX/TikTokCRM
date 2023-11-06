import crypto from 'crypto';
import Interval from "common/utils/Interval.js";
import { DatabaseCache } from 'common/databases/Redis/Redis.js';
import config from "common/configs/config.json" assert { type: "json" };

const SessionIdCookieName = "__Secure-authorization";
const SessionIdCookieOptions = {
    domain: config.website.host,
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'Lax',
    signed: true
};

async function register(app, options)
{
    app.decorateReply("createSessionID", async function()
    {
        const data = { };
        const session_id = crypto.randomBytes(32).toString('base64');
        const interval = new Interval(config.website.authorization_expiration);
        await DatabaseCache.setExpire(`session_id-${session_id}`, JSON.stringify(data), interval);
        this.setCookie(SessionIdCookieName, session_id, SessionIdCookieOptions);
        return session_id;
    });



    app.decorateRequest("session_id", null);
    app.decorateRequest("getSessionID", function()
    {
        if (this.session_id) return this.session_id;
        try
        {
            const session_id = this.unsignCookie(this.cookies[SessionIdCookieName]);
            if (session_id.valid && session_id.value.length == 44) return this.session_id = session_id.value;
        } catch(err) { }
        return this.session_id = null;
    });
    
    app.decorateRequest("session_id_data", null);
    app.decorateRequest("resolveSessionID", async function()
    {
        if (this.session_id_data) return this.session_id_data;

        const interval = new Interval(config.website.authorization_expiration);
        const cached_string = await DatabaseCache.getExpire(`session_id-${this.getSessionID()}`, interval);
        if (!cached_string) return this.session_id_data = null;
        this.session_id_data = JSON.parse(cached_string);

        let data = this.session_id_data;
        if (!data.expiration || new Date(data.expiration) <= new Date())
        {
            data = { };
            const lifetime = new Interval(config.website.user_data_expiration);
            data.expiration = Date.now() + lifetime.toMilliseconds();
        }

        await DatabaseCache.setKeepTTL(`session_id-${this.getSessionID()}`, JSON.stringify(data));
        return this.session_id_data = data;
    });



    app.decorateReply("removeSessionID", async function()
    {
        this.clearCookie(SessionIdCookieName, SessionIdCookieOptions);
        await DatabaseCache.delete(`session_id-${this.request.getSessionID()}`);
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'oauth-session_id', encapsulate: false });