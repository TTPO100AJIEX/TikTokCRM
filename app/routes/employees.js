import bcrypt from 'bcrypt';
import { Database } from 'common/databases/PostgreSQL/PostgreSQL.js';
import config from "common/configs/config.json" assert { type: "json" };

async function register(app, options)
{
    app.get("/employees", { config: { access: "ceo" } }, async (req, res) =>
    {
        const employees = await Database.execute(`SELECT id, login, access, responsibility, created, updated FROM employees ORDER BY created ASC`);
        return res.render("general/layout.ejs", { template: "employees", employees })
    });

    const POST_SCHEMA =
    {
        body:
        {
            type: "object",
            required: [ "login", "password", "access", "authentication" ],
            additionalProperties: false,
            properties:
            {
                "id": { $ref: "uint" },
                "login": { $ref: "login" },
                "password": { $ref: "password" },
                "access": { type: "string", enum: [ 'ADMIN', 'CEO', 'CURATOR', 'STREAMER_UNILIVE', 'STREAMER_BACKSTAGE' ] },
                "streams":
                {
                    type: "array",
                    uniqueItems: true,
                    items: { type: "string", enum: [ 'STREAM_1', 'STREAM_2', 'STREAM_3' ] }
                },
                "responsibility": { type: "string", enum: [ '', 'GROUP_1', 'GROUP_2', 'GROUP_3' ] },
                "authentication": { $ref: "authentication" }
            }
        }
    };
    app.post("/employees", { schema: POST_SCHEMA, config: { authentication: true, access: "admin" } }, async (req, res) =>
    {
        if (req.body.responsibility == '') req.body.responsibility = null;
        req.body.password = await bcrypt.hash(req.body.password, config.bcrypt.saltRounds);
        if ('id' in req.body)
        {
            const query_string = `UPDATE employees SET login = $1, password = $2, access = $3, streams = $4, responsibility = $5 WHERE id = $6`;
            await Database.execute(query_string, [ req.body.login, req.body.password, req.body.access, req.body.streams, req.body.responsibility, req.body.id ]);
        }
        else
        {
            const query_string = `INSERT INTO employees (login, password, access, streams, responsibility) VALUES ($1, $2, $3, $4, $5)`;
            await Database.execute(query_string, [ req.body.login, req.body.password, req.body.access, req.body.streams, req.body.responsibility ]);
        }
        return res.status(303).redirect("/employees");
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'employees-routes', encapsulate: false });