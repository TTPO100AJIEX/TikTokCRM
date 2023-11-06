import authorization from './oauth/authorization.js';
import authentication from './oauth/authentication.js';

async function register(app, options)
{
    await app.register(authentication, options);
    await app.register(authorization, options);
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'oauth', encapsulate: false });