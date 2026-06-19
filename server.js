const crypto = require("crypto");
const path = require("path");
const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;
const rootDir = __dirname;
const databaseUrl = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET || "local-development-secret";

const allowedCollections = new Set([
  "instruments",
  "calibrations",
  "dimensional",
  "standards",
  "inspectionPlans",
  "msa",
  "nonconformities",
  "documents",
  "suppliers"
]);

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    })
  : null;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(rootDir, { extensions: ["html"] }));

function id(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, hash] = storedHash.split(":");
  const candidate = hashPassword(password, salt).split(":")[1];
  if (hash.length !== candidate.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

function signToken(user) {
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Date.now() + 1000 * 60 * 60 * 12
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!data.exp || data.exp < Date.now()) return null;
  return data;
}

function requireDatabase(req, res, next) {
  if (!pool) {
    res.status(503).json({ error: "DATABASE_URL nao configurado." });
    return;
  }
  next();
}

function requireAuth(roles = []) {
  return (req, res, next) => {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const user = verifyToken(token);
    if (!user) {
      res.status(401).json({ error: "Sessao invalida ou expirada." });
      return;
    }
    if (roles.length && !roles.includes(user.role)) {
      res.status(403).json({ error: "Permissao insuficiente." });
      return;
    }
    req.user = user;
    next();
  };
}

async function audit(action, detail, entity, entityId, user) {
  if (!pool) return;
  await pool.query(
    `insert into audit_logs
      (id, action, detail, entity, entity_id, user_name, user_email, role)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id("audit"),
      action,
      detail || "",
      entity || "",
      entityId || "",
      user?.name || "Sistema",
      user?.email || "sistema@local",
      user?.role || "sistema"
    ]
  );
}

async function initDatabase() {
  if (!pool) {
    console.warn("DATABASE_URL nao definido. API de banco ficara indisponivel localmente.");
    return;
  }

  await pool.query(`
    create table if not exists users (
      id text primary key,
      name text not null,
      email text unique not null,
      password_hash text not null,
      role text not null check (role in ('desenvolvedor', 'gestor', 'funcionario')),
      job_title text default '',
      department text default 'Metrologia',
      active boolean not null default true,
      created_at timestamptz not null default now(),
      created_by_email text default ''
    );

    create table if not exists audit_logs (
      id text primary key,
      created_at timestamptz not null default now(),
      action text not null,
      detail text default '',
      entity text default '',
      entity_id text default '',
      user_name text not null,
      user_email text not null,
      role text not null
    );

    create table if not exists records (
      id text primary key,
      collection text not null,
      title text default '',
      status text default '',
      data jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      created_by_email text not null,
      created_by_name text not null,
      updated_at timestamptz,
      updated_by_email text
    );

    create index if not exists idx_records_collection on records(collection);
    create index if not exists idx_records_created_by_email on records(created_by_email);
    create index if not exists idx_audit_user_email on audit_logs(user_email);
  `);

  await seedDefaultUsers();
}

async function seedDefaultUsers() {
  const defaults = [
    {
      id: "dev-durigan",
      name: "Durigan Rian",
      email: process.env.DEV_EMAIL || "duriganrian7@gmail.com",
      password: process.env.DEV_PASSWORD || "DevLocal@2026",
      role: "desenvolvedor",
      jobTitle: "Desenvolvedor do sistema"
    },
    {
      id: "gestor-metrologia",
      name: "Gestor Metrologia",
      email: process.env.MANAGER_EMAIL || "gestor.metrologia@moreno.com",
      password: process.env.MANAGER_PASSWORD || "GestorLocal@2026",
      role: "gestor",
      jobTitle: "Gestor de metrologia"
    },
    {
      id: "funcionario-metrologia",
      name: "Funcionario Metrologia",
      email: process.env.EMPLOYEE_EMAIL || "funcionario.metrologia@moreno.com",
      password: process.env.EMPLOYEE_PASSWORD || "FuncionarioLocal@2026",
      role: "funcionario",
      jobTitle: "Tecnico de metrologia"
    }
  ];

  for (const user of defaults) {
    await pool.query(
      `insert into users (id, name, email, password_hash, role, job_title, department, active)
       values ($1, $2, $3, $4, $5, $6, 'Metrologia', true)
       on conflict (email) do update set
         name = excluded.name,
         role = excluded.role,
         job_title = excluded.job_title,
         active = true`,
      [user.id, user.name, normalizeEmail(user.email), hashPassword(user.password), user.role, user.jobTitle]
    );
  }
}

app.get("/api/health", async (req, res) => {
  if (!pool) {
    res.status(200).json({ ok: true, database: false });
    return;
  }

  try {
    await pool.query("select 1");
    res.json({ ok: true, database: true });
  } catch (error) {
    res.status(500).json({ ok: false, database: false, error: error.message });
  }
});

app.post("/api/auth/login", requireDatabase, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = req.body.password || req.body.senha;
  const result = await pool.query("select * from users where email = $1 and active = true", [email]);
  const user = result.rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: "Email ou senha invalidos." });
    return;
  }

  const publicUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    jobTitle: user.job_title,
    department: user.department
  };

  await audit("Login realizado", "Acesso autorizado ao sistema", "sessao", user.email, publicUser);
  res.json({ token: signToken(publicUser), user: publicUser });
});

app.get("/api/users", requireDatabase, requireAuth(["desenvolvedor", "gestor"]), async (req, res) => {
  const result = await pool.query(
    "select id, name, email, role, job_title as \"jobTitle\", department, active, created_at as \"createdAt\" from users order by created_at desc"
  );
  res.json(result.rows);
});

app.post("/api/users", requireDatabase, requireAuth(["desenvolvedor"]), async (req, res) => {
  if (normalizeEmail(req.user.email) !== normalizeEmail(process.env.DEV_EMAIL || "duriganrian7@gmail.com")) {
    res.status(403).json({ error: "Somente o desenvolvedor principal pode cadastrar usuarios." });
    return;
  }

  const role = req.body.role || req.body.perfil || "funcionario";

  const user = {
    id: id("user"),
    name: req.body.name || req.body.nome,
    email: normalizeEmail(req.body.email),
    password: req.body.password || req.body.senha,
    role,
    jobTitle: req.body.jobTitle || req.body.cargo || "",
    department: req.body.department || req.body.setor || "Metrologia"
  };

  await pool.query(
    `insert into users (id, name, email, password_hash, role, job_title, department, active, created_by_email)
     values ($1, $2, $3, $4, $5, $6, $7, true, $8)`,
    [user.id, user.name, user.email, hashPassword(user.password), user.role, user.jobTitle, user.department, req.user.email]
  );
  await audit("Usuario cadastrado", user.name, "usuario", user.email, req.user);
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.get("/api/audit", requireDatabase, requireAuth(["desenvolvedor", "gestor"]), async (req, res) => {
  const params = [];
  let where = "";
  if (req.query.email) {
    params.push(normalizeEmail(req.query.email));
    where = "where user_email = $1 or entity_id = $1";
  }

  const result = await pool.query(
    `select id, created_at as "createdAt", action, detail, entity, entity_id as "entityId",
      user_name as "userName", user_email as "userEmail", role
     from audit_logs ${where}
     order by created_at desc
     limit 500`,
    params
  );
  res.json(result.rows);
});

app.get("/api/records/:collection", requireDatabase, requireAuth(), async (req, res) => {
  const collection = req.params.collection;
  if (!allowedCollections.has(collection)) {
    res.status(404).json({ error: "Colecao desconhecida." });
    return;
  }

  const result = await pool.query(
    `select id, collection, title, status, data, created_at as "createdAt",
      created_by_email as "createdByEmail", created_by_name as "createdByName"
     from records where collection = $1 order by created_at desc`,
    [collection]
  );
  res.json(result.rows);
});

app.post("/api/records/:collection", requireDatabase, requireAuth(["desenvolvedor"]), async (req, res) => {
  if (normalizeEmail(req.user.email) !== normalizeEmail(process.env.DEV_EMAIL || "duriganrian7@gmail.com")) {
    res.status(403).json({ error: "Somente o administrador pode cadastrar registros." });
    return;
  }

  const collection = req.params.collection;
  if (!allowedCollections.has(collection)) {
    res.status(404).json({ error: "Colecao desconhecida." });
    return;
  }

  const record = {
    id: req.body.id || id(collection),
    title: req.body.title || req.body.titulo || req.body.nome || req.body.codigo || req.body.instrumento || "",
    status: req.body.status || req.body.resultado || "",
    data: req.body
  };

  await pool.query(
    `insert into records (id, collection, title, status, data, created_by_email, created_by_name)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (id) do update set
       title = excluded.title,
       status = excluded.status,
       data = excluded.data,
       updated_at = now(),
       updated_by_email = $6`,
    [record.id, collection, record.title, record.status, record.data, req.user.email, req.user.name]
  );
  await audit("Registro criado", record.title, collection, record.id, req.user);
  res.status(201).json(record);
});

app.put("/api/records/:collection/:id", requireDatabase, requireAuth(["desenvolvedor"]), async (req, res) => {
  if (normalizeEmail(req.user.email) !== normalizeEmail(process.env.DEV_EMAIL || "duriganrian7@gmail.com")) {
    res.status(403).json({ error: "Somente o administrador pode editar registros." });
    return;
  }

  const collection = req.params.collection;
  if (!allowedCollections.has(collection)) {
    res.status(404).json({ error: "Colecao desconhecida." });
    return;
  }

  const record = {
    id: req.params.id,
    title: req.body.title || req.body.titulo || req.body.nome || req.body.codigo || req.body.instrumento || "",
    status: req.body.status || req.body.resultado || "",
    data: req.body
  };

  const result = await pool.query(
    `update records
     set title = $1, status = $2, data = $3, updated_at = now(), updated_by_email = $4
     where id = $5 and collection = $6
     returning id, collection, title, status, data`,
    [record.title, record.status, record.data, req.user.email, record.id, collection]
  );

  if (!result.rows[0]) {
    res.status(404).json({ error: "Registro nao encontrado." });
    return;
  }

  await audit("Registro editado", record.title, collection, record.id, req.user);
  res.json(result.rows[0]);
});

app.delete("/api/records/:collection/:id", requireDatabase, requireAuth(["desenvolvedor"]), async (req, res) => {
  if (normalizeEmail(req.user.email) !== normalizeEmail(process.env.DEV_EMAIL || "duriganrian7@gmail.com")) {
    res.status(403).json({ error: "Somente o administrador pode excluir registros." });
    return;
  }

  const collection = req.params.collection;
  if (!allowedCollections.has(collection)) {
    res.status(404).json({ error: "Colecao desconhecida." });
    return;
  }

  const result = await pool.query(
    "delete from records where id = $1 and collection = $2 returning title",
    [req.params.id, collection]
  );

  if (!result.rows[0]) {
    res.status(404).json({ error: "Registro nao encontrado." });
    return;
  }

  await audit("Registro excluido", result.rows[0].title || req.params.id, collection, req.params.id, req.user);
  res.json({ ok: true });
});

app.delete("/api/database", requireDatabase, requireAuth(["desenvolvedor"]), async (req, res) => {
  if (normalizeEmail(req.user.email) !== normalizeEmail(process.env.DEV_EMAIL || "duriganrian7@gmail.com")) {
    res.status(403).json({ error: "Somente o desenvolvedor principal pode apagar o banco." });
    return;
  }

  if (req.body.confirmation !== "APAGAR BANCO") {
    res.status(400).json({ error: "Confirmacao invalida." });
    return;
  }

  const password = req.body.password || req.body.senha;
  const result = await pool.query("select * from users where email = $1", [normalizeEmail(req.user.email)]);
  if (!result.rows[0] || !verifyPassword(password, result.rows[0].password_hash)) {
    res.status(403).json({ error: "Senha do desenvolvedor incorreta." });
    return;
  }

  await pool.query("truncate table records, audit_logs, users restart identity");
  await seedDefaultUsers();
  await audit("Banco de dados apagado", "Todos os dados foram removidos e usuarios padrao recriados", "database", "postgres", req.user);
  res.json({ ok: true });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

initDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Sistema de metrologia ouvindo na porta ${port}`);
    });
  })
  .catch((error) => {
    console.error("Falha ao inicializar banco de dados:", error);
    process.exit(1);
  });
