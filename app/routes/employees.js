async function register(app, options)
{
    app.get("/employees", { config: { access: "ceo" } }, (req, res) => res.render("general/layout.ejs", { template: "employees" }));
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'employees-routes', encapsulate: false });