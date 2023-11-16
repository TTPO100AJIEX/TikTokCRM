import bcrypt from 'bcrypt';
import { Database } from 'common/databases/PostgreSQL/PostgreSQL.js';

async function register(app, options)
{
    const VALIDATE_SCHEMA =
    {
        query:
        {
            type: "object",
            required: [ "login", "password" ],
            additionalProperties: false,
            properties:
            {
                "login": { $ref: "login" },
                "password": { $ref: "password" }
            }
        },
        response:
        {
            200:
            {
                type: "object",
                required: [ "valid" ],
                additionalProperties: false,
                properties:
                {
                    "valid": { type: "boolean" }
                }
            }
        }
    };
    app.get("/validate", { schema: VALIDATE_SCHEMA, config: { api: true, access: "public" } }, async (req, res) =>
    {
        const query_string = `SELECT password FROM employees WHERE login = $1`;
        const users = await Database.execute(query_string, [ req.query.login ]);
        if (users.length == 0) return { valid: false };
        for (const { password } of users)
        {
            if (await bcrypt.compare(req.query.password, password)) return { valid: true };
        }
        return { valid: false };
    });

    const LOGIN_SCHEMA =
    {
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
        return res.status(303).redirect("/streamers");
    });


    app.get("/logout", { config: { access: "authorization" } }, async (req, res) =>
    {
        await res.removeSessionID();
        return res.status(301).redirect("/");
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'oauth-routes', encapsulate: false });