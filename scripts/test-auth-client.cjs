/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ts = require("typescript");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tasktrack-auth-client-"));
try {
  for (const name of ["config", "types", "auth-session", "api-client", "auth-form-validation", "dashboard"]) {
    const source = fs.readFileSync(path.join(__dirname, "..", "lib", `${name}.ts`), "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    fs.writeFileSync(path.join(tempRoot, `${name}.js`), output);
  }
  const session = require(path.join(tempRoot, "auth-session.js"));
  const { apiClient, ApiError, request } = require(path.join(tempRoot, "api-client.js"));
  const { validateRegister, validateLogin } = require(path.join(tempRoot, "auth-form-validation.js"));
  const { loadDashboardCounts } = require(path.join(tempRoot, "dashboard.js"));
  const storage = new Map();
  const navigation = [];
  global.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    dispatchEvent: () => {},
    location: { pathname: "/admin", replace: (path) => navigation.push(path) },
  };
  const account = {
    accountId: 7, fullName: "Test Staff", email: "staff@example.invalid", role: 0,
    createdDate: "2026-10-14T00:00:00Z",
  };
  const makeToken = (exp) => `a.${Buffer.from(JSON.stringify({
    accountId: 7, email: account.email, role: "Staff", roleId: 0, exp,
  })).toString("base64url")}.c`;
  const token = makeToken(Math.floor(Date.now() / 1000) + 3600);
  const calls = [];
  const replies = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return replies.shift() ?? new Response("{}", { status: 200,
      headers: { "content-type": "application/json" } });
  };
  const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { "content-type": "application/json" },
  });

  (async () => {
    assert.ok(validateRegister({ fullName: " ", email: "bad", password: "short", confirmPassword: "no" }).fullName);
    assert.ok(validateRegister({ fullName: "Test", email: "bad", password: "short", confirmPassword: "no" }).email);
    assert.ok(validateRegister({ fullName: "Test", email: "test@example.invalid", password: "short", confirmPassword: "no" }).password);
    assert.ok(validateRegister({ fullName: "Test", email: "test@example.invalid", password: "Example123!", confirmPassword: "no" }).confirmPassword);
    assert.deepEqual(validateRegister({ fullName: "Test", email: "test@example.invalid", password: "Example123!", confirmPassword: "Example123!" }), {});
    assert.ok(validateLogin({ email: "bad", password: "" }).email);
    assert.ok(validateLogin({ email: "test@example.invalid", password: "" }).password);
    assert.deepEqual(validateLogin({ email: "test@example.invalid", password: "Example123!" }), {});
    assert.equal(session.getSession(), null);
    await apiClient.departments.getAll();
    assert.equal(calls.at(-1).options.headers.has("Authorization"), false);
    await request("/departments", { headers: { Authorization: "Bearer explicit" } });
    assert.equal(calls.at(-1).options.headers.get("Authorization"), "Bearer explicit");
    replies.push(json(account, 201));
    await apiClient.auth.register({ fullName: "Test", email: account.email, password: "Example123!" });
    assert.equal(calls.at(-1).options.headers.has("Authorization"), false);
    assert.deepEqual(navigation, []);
    replies.push(json({ title: "Conflict", status: 409 }, 409));
    await assert.rejects(apiClient.auth.register({ fullName: "Test", email: account.email, password: "Example123!" }),
      (error) => error.status === 409);
    assert.deepEqual(navigation, []);
    replies.push(json({ title: "Invalid email or password", status: 401 }, 401));
    await assert.rejects(apiClient.auth.login({ email: account.email, password: "wrong" }),
      (error) => error.status === 401);
    assert.deepEqual(navigation, []);

    replies.push(json({ token, tokenType: "Bearer", expiresAt: "unused", account }));
    const loginResponse = await apiClient.auth.login({ email: account.email, password: "Example123!" });
    session.saveSession(loginResponse);
    assert.ok(session.getSession());
    assert.equal(storage.get("tasktrack.auth.session").includes("Example123!"), false);
    session.clearSession();

    session.saveSession({ token, tokenType: "Bearer", expiresAt: "unused", account });
    await apiClient.tags.create({ tagName: "New" });
    assert.equal(calls.at(-1).options.headers.get("Authorization"), `Bearer ${token}`);
    await apiClient.accounts.getAll();
    assert.equal(calls.at(-1).options.headers.get("Authorization"), `Bearer ${token}`);
    await apiClient.projects.getAll();
    assert.equal(calls.at(-1).options.headers.has("Authorization"), false);
    replies.push(json([{}, {}]), json([{}]), json([{}, {}, {}]), json([]));
    assert.deepEqual(await loadDashboardCounts(), { departments: 2, projects: 1, tasks: 3, tags: 0 });
    for (const call of calls.slice(-4)) assert.equal(call.options.headers.has("Authorization"), false);

    replies.push(json({ title: "Forbidden", status: 403 }, 403));
    await assert.rejects(apiClient.accounts.getAll(), (error) => error instanceof ApiError && error.status === 403);
    assert.ok(session.getSession());
    assert.deepEqual(navigation, []);

    replies.push(json({ title: "Unauthorized", status: 401 }, 401));
    await assert.rejects(apiClient.tags.create({ tagName: "Retry" }), (error) => error.status === 401);
    assert.equal(session.getSession(), null);
    assert.deepEqual(navigation, ["/login"]);

    session.saveSession({ token, tokenType: "Bearer", expiresAt: "unused", account });
    const expired = makeToken(Math.floor(Date.now() / 1000) - 1);
    storage.set("tasktrack.auth.session", JSON.stringify({ token: expired, account, expiresAt: "unused" }));
    assert.equal(session.getSession(), null);
    assert.deepEqual(navigation, ["/login"]);
    console.log("PASS A2-09/10/11: public GET, Bearer, 401/403/expiry; auth forms; dashboard counts.");
  })().catch((error) => { console.error(error); process.exitCode = 1; });
} finally {
  const resolved = path.resolve(tempRoot);
  if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) ||
      !path.basename(resolved).startsWith("tasktrack-auth-client-"))
    throw new Error("Unsafe test cleanup path.");
  process.on("exit", () => fs.rmSync(resolved, { recursive: true, force: true }));
}
