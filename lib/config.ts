// The base URL includes /api. Public environment variables must never contain secrets.
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5200/api"
).replace(/\/$/, "");
