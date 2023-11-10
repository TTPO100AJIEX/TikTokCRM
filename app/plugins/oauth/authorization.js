import session_id from './session_id.js';

async function register(app, options)
{
    await app.register(session_id, options);

    app.decorateRequest("hasPublicAccess", function()
    {
        return true;
    });
    app.decorateRequest("hasAuthorizationAccess", function()
    {
        return this.hasPublicAccess() && this.authorization;
    });
    app.decorateRequest("hasAdminAccess", function()
    {
        return this.hasAuthorizationAccess() && this.authorization.access == "ADMIN";
    });
    app.decorateRequest("hasCEOAccess", function()
    {
        return this.hasAuthorizationAccess() && (this.hasAdminAccess() || this.authorization.access == "CEO");
    });
    app.decorateRequest("hasCuratorAccess", function()
    {
        return this.hasAuthorizationAccess() && (this.hasAdminAccess() || this.authorization.access == "CURATOR");
    });
    app.decorateRequest("hasStreamerUniliveAccess", function()
    {
        return this.hasAuthorizationAccess() && (this.hasAdminAccess() || this.authorization.access == "STREAMER_UNILIVE");
    });
    app.decorateRequest("hasStreamerBackstageAccess", function()
    {
        return this.hasAuthorizationAccess() && (this.hasAdminAccess() || this.authorization.access == "STREAMER_BACKSTAGE");
    });
    app.decorateRequest("hasAccess", function(level)
    {
        switch(level)
        {
            case 'public': return this.hasPublicAccess();
            case 'authorization': return this.hasAuthorizationAccess();
            case 'admin': return this.hasAdminAccess();
            case 'ceo': return this.hasCEOAccess();
            case 'curator': return this.hasCuratorAccess();
            case 'streamer_unilive': return this.hasStreamerUniliveAccess();
            case 'streamer_backstage': return this.hasStreamerBackstageAccess();
            default: return false;
        }
    });
    
    app.decorateRequest("authorization", null);
    app.decorateRequest("authorize", async function()
    {
        if (this.authorization) return this.authorization;
        return this.authorization = await this.resolveSessionID();
    });
    app.addHook('preHandler', async (req, res) => 
    {
        if (!req.routeOptions.config?.access) return;
        await req.authorize();
        if ([ req.routeOptions.config.access ].flat().every(access => !req.hasAccess(access)))
        {
            if (req.authorization) throw 403;
            else throw 401;
        }
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'oauth-authorization', encapsulate: false });