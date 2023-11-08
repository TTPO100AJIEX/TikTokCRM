async function register(app, options)
{
    /*app.get("/validate", { schema: LOGIN_SCHEMA, config: { authentication: true, access: "public" } }, async (req, res) =>
    {
        await res.createSessionID(req.body.login, req.body.password);
        return res.status(303).redirect((await req.authenticate()).page);
    });*/

    const LOGIN_SCHEMA = {
        body:
        {
            type: "object",
            required: [ "login", "password", "authentication" ],
            additionalProperties: false,
            properties:
            {
                "login": { $ref: "login" },
                "password": { $ref: "password" },
                "authentication": { $ref: "authentication" }
            }
        }
    };
    app.post("/login", { schema: LOGIN_SCHEMA, config: { authentication: true, access: "public" } }, async (req, res) =>
    {
        await res.createSessionID(req.body.login, req.body.password);
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