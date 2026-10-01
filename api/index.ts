// Vercel serverless entrypoint. Vercel treats any default export here as
// a request handler -- an Express app's (req, res) signature matches that
// directly, so no adapter is needed. vercel.json rewrites every /api/*
// request to this one function; the app's own routes (defined in
// ../server/app.ts) still match on the full original path.
export { default } from "../server/app.js";
