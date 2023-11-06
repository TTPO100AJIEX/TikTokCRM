import fs from 'fs';
import path from 'path';

async function scanDirectory(app, directory)
{
    for (const filename of fs.readdirSync(directory))
    {
        const fileStats = fs.lstatSync(path.join(directory, filename));
        if (fileStats.isDirectory()) await scanDirectory(app, path.join(directory, filename));
        if (!fileStats.isFile()) continue;
        const { default: module } = await import(path.join(directory, filename));
        await app.register(module);
    }
}

async function register(app, options)
{
    app.get('/favicon.ico', (req, res) => res.sendFile("favicon.ico", path.join(options.static_directory, 'images', 'favicon')));
    app.get('/apple-touch-icon.png', (req, res) => res.sendFile("apple-touch-icon.png", path.join(options.static_directory, 'images', 'favicon')));
    app.get('/robots.txt', (req, res) => res.sendFile("robots.txt", options.static_directory));
    app.get('/sitemap.xml', (req, res) => res.sendFile("sitemap.xml", options.static_directory));
    await scanDirectory(app, options.routes_directory);
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'routes', encapsulate: false });