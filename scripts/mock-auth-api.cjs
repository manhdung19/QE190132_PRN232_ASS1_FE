/* eslint-disable @typescript-eslint/no-require-imports */
// Disposable local API fixture for browser checks. Never use for production.
const http = require("node:http");

const account = {
  accountId: 7, fullName: "Browser Test Staff", email: "staff@example.invalid",
  role: 0, createdDate: "2026-10-14T00:00:00Z",
};
const admin = {
  accountId: 1, fullName: "Browser Test Admin", email: "admin@example.invalid",
  role: 1, createdDate: "2026-10-14T00:00:00Z",
};
const accounts = [admin, account, {
  accountId: 8, fullName: "Task Owner", email: "owner@example.invalid",
  role: 0, createdDate: "2026-10-14T00:00:00Z",
}];

function tokenClaims(request) {
  try {
    return JSON.parse(Buffer.from(request.headers.authorization.split(".")[1], "base64url").toString());
  } catch { return null; }
}
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

const idFields = { departments: "departmentId", projects: "projectId", tasks: "taskId", tags: "tagId" };

async function readJson(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return body ? JSON.parse(body) : {};
}

http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") return send(response, 204, null);
  const path = new URL(request.url, "http://localhost:5200").pathname;
  if (path === "/api/auth/login" && request.method === "POST") {
    const credentials = await readJson(request);
    if (credentials.password !== "ExamplePass123!" ||
        !["staff@example.invalid", "expiring@example.invalid", "admin@example.invalid"].includes(credentials.email))
      return send(response, 401, { status: 401, title: "Invalid email or password" });
    const loggedIn = credentials.email === "admin@example.invalid" ? admin : account;
    const exp = Math.floor(Date.now() / 1000) +
      (credentials.email === "expiring@example.invalid" ? 8 : 3600);
    const token = `a.${Buffer.from(JSON.stringify({ accountId: loggedIn.accountId,
      email: loggedIn.email, role: loggedIn.role === 1 ? "Admin" : "Staff",
      roleId: loggedIn.role, exp })).toString("base64url")}.c`;
    return send(response, 200, { token, tokenType: "Bearer",
      expiresAt: new Date(exp * 1000).toISOString(), account: loggedIn });
  }
  if (path === "/api/accounts" || path.startsWith("/api/accounts/")) {
    const claims = tokenClaims(request);
    if (!claims) return send(response, 401, { status: 401, title: "Unauthorized" });
    if (claims.roleId !== 1) return send(response, 403, { status: 403, title: "Forbidden" });
    const match = path.match(/^\/api\/accounts\/(\d+)$/);
    const id = match ? Number(match[1]) : null;
    const index = accounts.findIndex((item) => item.accountId === id);
    if (request.method === "GET" && id === null) return send(response, 200, accounts);
    if (index < 0) return send(response, 404, { status: 404, title: "Not found" });
    if (request.method === "GET") return send(response, 200, accounts[index]);
    if (request.method === "PUT") {
      const data = await readJson(request);
      accounts[index] = { ...accounts[index], fullName: data.fullName, role: data.role };
      return send(response, 200, accounts[index]);
    }
    if (request.method === "DELETE") {
      if (id === 8 || id === claims.accountId)
        return send(response, 400, { status: 400, title: "Operation blocked",
          errors: { operation: [id === 8 ? "Cannot delete an account that created tasks." : "Cannot delete current Admin."] } });
      accounts.splice(index, 1);
      return send(response, 204, null);
    }
  }
  for (const [resource, items] of Object.entries(collections)) {
    if (path === `/api/${resource}` && request.method === "GET")
      return send(response, 200, resource === "tasks" ? items.filter((item) => item.isActive) : items);
    if (path === `/api/${resource}/search` && request.method === "GET")
      return send(response, 200, resource === "tasks" ? items.filter((item) => item.isActive) : items);
    const match = path.match(new RegExp(`^/api/${resource}/(\\d+)$`));
    const id = match ? Number(match[1]) : null;
    const idField = idFields[resource];
    const index = id === null ? -1 : items.findIndex((item) => item[idField] === id);
    if (request.method === "GET" && index >= 0) return send(response, 200, items[index]);
    if (request.method === "GET" && id !== null) return send(response, 404, { status: 404, title: "Not found" });
    if (path !== `/api/${resource}` && id === null) continue;
    if (!["POST", "PUT", "DELETE"].includes(request.method)) continue;
    if (!request.headers.authorization?.startsWith("Bearer "))
      return send(response, 401, { status: 401, title: "Unauthorized" });
    if (request.method === "POST") {
      const data = await readJson(request);
      const nextId = Math.max(0, ...items.map((item) => item[idField])) + 1;
      const created = { ...data, [idField]: nextId };
      if (resource === "tasks") {
        created.createdDate = new Date().toISOString();
        created.tags = collections.tags.filter((tag) => data.tagIds?.includes(tag.tagId));
      }
      if (resource === "projects") { created.createdDate = new Date().toISOString(); created.departmentName = "Engineering"; created.tasks = []; }
      if (resource === "departments") created.projects = [];
      items.push(created);
      return send(response, 201, created);
    }
    if (index < 0) return send(response, 404, { status: 404, title: "Not found" });
    if (request.method === "PUT") {
      const data = await readJson(request);
      items[index] = { ...items[index], ...data, [idField]: id };
      if (resource === "tasks")
        items[index].tags = collections.tags.filter((tag) => data.tagIds?.includes(tag.tagId));
      return send(response, 200, items[index]);
    }
    if (resource === "tasks") items[index].isActive = false;
    else items.splice(index, 1);
    return send(response, 204, null);
  }
  return send(response, 404, { status: 404, title: "Not found" });
}).listen(5200, "127.0.0.1", () => console.log("Mock API ready on 127.0.0.1:5200"));
