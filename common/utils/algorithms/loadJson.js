import path from 'path';

export default async function loadJson(filename)
{
    switch (path.parse(filename).ext)
    {
        case ".js": return (await import(filename)).default;
        case ".json": return (await import(filename, { assert: { type: "json" } })).default;
        default: throw `loadJson - unknown extension ${path.parse(filename).ext} detected for file ${filename}`;
    }
}