import { DatabaseCache } from "common/databases/Redis/Redis.js";
import config from "common/configs/config.json" assert { type: "json" };

import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rate_limit from "@fastify/rate-limit";

async function register(app, options)
{
    /*----------------------------------RATE LIMIT----------------------------------*/
    await app.register(rate_limit, {
        global: true,
        max: config.stage == "testing" ? 1000000 : 500,
        timeWindow: 60000,
        ban: config.stage == "testing" ? 1500000 : 750,
        continueExceeding: true,
        addHeadersOnExceeding: { 'x-ratelimit-limit': false, 'x-ratelimit-remaining': false, 'x-ratelimit-reset': false, 'retry-after': false },
        addHeaders: { 'x-ratelimit-limit': false, 'x-ratelimit-remaining': true, 'x-ratelimit-reset': false, 'retry-after': true },
        cache: 10000,
        redis: DatabaseCache.client,
        nameSpace: 'website-rate-limit-',
        skipOnError: true,
        onExceeded: (req) => console.info(`Rate Limit exceeded by ${req.ip}`)
    });



    
    /*----------------------------------HELMET----------------------------------*/
    await app.register(helmet,
    {
        global: true,
        enableCSPNonces: true,
        contentSecurityPolicy: 
        {
            useDefaults: false,
            directives: 
            {
                "default-src": [ "'none'" ],
    
                //"child-src": [ "'self'" ],
                "connect-src": [ "'self'", "'report-sample'" ],
                "font-src": [ "'self'", "https://fonts.gstatic.com", "'report-sample'" ],
                //"frame-src": [ "'self'" ],
                "img-src": [ "'self'", "*.tiktokcdn.com", "'report-sample'" ],
                //"media-src": [ "'self'" ],
                //"object-src": [ "'self'" ],
                //"prefetch-src": [ "'self'" ],
                "script-src": [ "'strict-dynamic'", "'self'", "'report-sample'" ],
                "style-src": [ "'self'", "https://fonts.googleapis.com", "'report-sample'" ],
                //"worker-src": [ "'self'" ],
    
                "base-uri": [ "'none'" ],
    
                "form-action": [ "'self'", "'report-sample'" ],
                //"frame-ancestors": [ "'self'" ],
    
                "report-uri": [ "/csp-violation-report" ],
                "report-to": [ "dolix" ],
                "require-trusted-types-for": [ "'script'" ],
                "upgrade-insecure-requests": [ ]
            }
        },
        crossOriginEmbedderPolicy: true, //require-corp
        crossOriginOpenerPolicy: { policy: "same-origin" },
        crossOriginResourcePolicy: { policy: "same-origin" },
        originAgentCluster: true,
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
        strictTransportSecurity: { maxAge: 7 * 24 * 60 * 60, includeSubDomains: false, preload: true },
        xContentTypeOptions: true,
        dnsPrefetchControl: { allow: true },
        xFrameOptions: { action: "sameorigin" },
        hidePoweredBy: true
    });
    app.addContentTypeParser('application/csp-report', { parseAs: 'string' }, function (request, payload, done)
    {
        try { done(null, JSON.parse(payload)) } catch(err) { err.statusCode = 400; done(err, undefined); }
    });
    app.addContentTypeParser('application/reports+json', {parseAs: 'string'}, function (request, payload, done)
    {
        try { done(null, JSON.parse(payload)) } catch(err) { err.statusCode = 400; done(err, undefined); }
    });
    app.addHook("onRequest", (req, res, next) =>
    {
        res.header('Report-To', `{"group":"tiktokcrm","max_age":10886400,"endpoints":[{"url": "https://${req.hostname}/csp-violation-report"}]}`);
        res.header('Reporting-Endpoints', `tiktokcrm="/csp-violation-report"`);
        next();
    });
    app.post('/csp-violation-report', { config: { authentication: false } }, (req, res) => 
    {
        console.warn(req.body);
        return res.send("Acknowledged");
    });
    



    /*----------------------------------CORS----------------------------------*/
    await app.register(cors,
    {
        origin: `https://${config.website.host}`,
        methods: 'GET,HEAD,POST',
        maxAge: 300,
        optionsSuccessStatus: 204,
        preflight: true,
        strictPreflight: true,
        hideOptionsRoute: true
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'security', encapsulate: false });