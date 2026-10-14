/* eslint-disable @typescript-eslint/no-require-imports */
// Disposable local API fixture for browser checks. Never use for production.
const http = require("node:http");

const account = {
  accountId: 7, fullName: "Browser Test Staff", email: "staff@example.invalid",
  role: 0, createdDate: "2026-10-14T00:00:00Z",
};
const collections = {
  departments: [
    { departmentId: 1, departmentName: "Engineering", departmentDescription: "Test department", isActive: true },
    { departmentId: 2, departmentName: "Design", departmentDescription: "Test department", isActive: true },
  ],
  projects: [{ projectId: 1, projectName: "Sample Project", description: "Test", startDate: "2026-10-14", status: 0, departmentId: 1, departmentName: "Engineering", isActive: true, createdDate: "2026-10-14T00:00:00Z", tasks: [] }],
  tasks: [1, 2, 3].map((id) => ({ taskId: id, title: `Sample Task ${id}`, status: 0,
    priority: 1, projectId: 1, isActive: true, createdDate: "2026-10-14T00:00:00Z", tags: [] })),
  tags: [],
};

function send(response, status, value) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "http://localhost:3101",
    "Access-Control-Allow-Headers": "authorization,content-type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(value));
}

http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") return send(response, 204, null);
  const path = new URL(request.url, "http://localhost:5200").pathname;
  if (path === "/api/auth/login" && request.method === "POST") {
    let body = "";
    for await (const chunk of request) body += chunk;
    const credentials = JSON.parse(body);
    if (credentials.password !== "ExamplePass123!" ||
        !["staff@example.invalid", "expiring@example.invalid"].includes(credentials.email))
      return send(response, 401, { status: 401, title: "Invalid email or password" });
    const exp = Math.floor(Date.now() / 1000) +
      (credentials.email === "expiring@example.invalid" ? 8 : 3600);
    const token = `a.${Buffer.from(JSON.stringify({ accountId: account.accountId,
      email: account.email, role: "Staff", roleId: 0, exp })).toString("base64url")}.c`;
    return send(response, 200, { token, tokenType: "Bearer",
      expiresAt: new Date(exp * 1000).toISOString(), account });
  }
  for (const [resource, items] of Object.entries(collections)) {
    if (path === `/api/${resource}` && request.method === "GET") return send(response, 200, items);
  }
  return send(response, 404, { status: 404, title: "Not found" });
}).listen(5200, "127.0.0.1", () => console.log("Mock API ready on 127.0.0.1:5200"));
