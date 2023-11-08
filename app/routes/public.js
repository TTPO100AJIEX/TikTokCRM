async function register(app, options)
{
    app.get("/", { config: { access: "public" } }, (req, res) => res.render("main.ejs"));
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'public-routes', encapsulate: false });