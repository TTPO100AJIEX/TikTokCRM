async function register(app, options)
{
    const LOGIN_SCHEMA = {
        query:
        {
            type: "object",
            required: [ "state" ],
            additionalProperties: false,
            properties:
            {
                "state": { $ref: "authentication" }
            }
        }
    };
    app.get("/login", { schema: LOGIN_SCHEMA, config: { authentication: true, access: "public" } }, async (req, res) =>
    {
        await res.createSessionID();
        return res.status(303).redirect((await req.authenticate()).page);
    });


    app.get("/logout", { config: { access: "authorization" } }, async (req, res) =>
    {
        await res.removeSessionID();
        return res.status(301).redirect("/");
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'oauth-routes', encapsulate: false });