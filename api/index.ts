// @ts-nocheck
// Vercel serverless entry. The full Express server is pre-bundled into a
// single self-contained CommonJS file (server-bundle.cjs) during the build
// (see vercel.json buildCommand). We require that here so Vercel doesn't have
// to resolve/transpile the whole server/ TypeScript tree at runtime.
const mod = require('../server-bundle.cjs');
module.exports = mod.default || mod;
